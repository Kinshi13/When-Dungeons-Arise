package com.stellafounds.app;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Serviço que escuta as notificações do sistema em segundo plano — só funciona depois que o
 * usuário ativa manualmente o acesso em Ajustes > Apps > Acesso especial > Acesso a notificações
 * (o Android não deixa pedir essa permissão por um diálogo comum, é uma decisão explícita do
 * usuário, igual acessibilidade). Guarda um cache simples em memória; o NotificationBridgePlugin
 * lê esse cache sob demanda quando a tela de gerenciamento pede (modelo "pull", sem push em
 * tempo real por enquanto).
 *
 * Importante: o CONTEÚDO (título/texto) só é guardado para apps que o usuário marcou como
 * "Monitorar" em Ajustes › Notificações monitoradas — a lista de pacotes liberados fica em
 * SharedPreferences, sincronizada pelo NotificationBridgePlugin.setMonitoredPackages. Pra
 * qualquer outro app, só nome/pacote ficam disponíveis (o suficiente pra aparecer em Ajustes
 * e o usuário decidir se quer ativar), nunca o texto da notificação. Isso evita que o serviço
 * acumule o conteúdo de TODA notificação do aparelho (bancos incluídos) o tempo todo, o que é
 * exatamente o padrão que scanners como o Play Protect associam a malware bancário.
 */
public class AppNotificationListenerService extends NotificationListenerService {

    private static final int MAX_CACHED = 100;
    private static final Deque<JSObject> cache = new ArrayDeque<>();

    private static final String PREFS_NAME = "notification_bridge_prefs";
    private static final String KEY_MONITORED_PACKAGES = "monitored_packages";

    public static boolean isAccessGranted(Context context) {
        String enabled = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        return enabled != null && enabled.contains(context.getPackageName());
    }

    public static synchronized JSArray getCachedNotifications() {
        JSArray array = new JSArray();
        for (JSObject item : cache) {
            array.put(item);
        }
        return array;
    }

    public static Set<String> getMonitoredPackages(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_MONITORED_PACKAGES, "[]");
        Set<String> result = new HashSet<>();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                result.add(arr.getString(i));
            }
        } catch (JSONException e) {
            // Preferência corrompida ou vazia — trata como nenhum app liberado ainda.
        }
        return result;
    }

    public static void setMonitoredPackages(Context context, List<String> packages) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        JSONArray arr = new JSONArray();
        for (String pkg : packages) {
            arr.put(pkg);
        }
        prefs.edit().putString(KEY_MONITORED_PACKAGES, arr.toString()).apply();
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        // Backfill: sem isso, o histórico fica vazio até a PRÓXIMA notificação
        // nova chegar — mesmo que várias já estivessem ativas na barra do
        // sistema (reboot do aparelho, app forçado a parar, ou primeira vez
        // que o usuário liga o acesso em Ajustes). Achado da auditoria da
        // Fase 7 (seção "riscos atuais").
        StatusBarNotification[] active = getActiveNotifications();
        if (active == null) return;
        // Da mais antiga pra mais nova, já que cacheNotification usa addFirst
        // — processar nessa ordem deixa a mais recente no topo do cache no
        // final, igual já aconteceria organicamente com onNotificationPosted.
        for (int i = active.length - 1; i >= 0; i--) {
            cacheNotification(active[i]);
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        cacheNotification(sbn);
    }

    private void cacheNotification(StatusBarNotification sbn) {
        Notification notification = sbn.getNotification();
        if (notification == null) return;

        boolean monitored = getMonitoredPackages(getApplicationContext()).contains(sbn.getPackageName());

        JSObject item = new JSObject();
        item.put("id", sbn.getKey());
        item.put("packageName", sbn.getPackageName());
        item.put("appName", resolveAppName(sbn.getPackageName()));
        item.put("postTime", sbn.getPostTime());

        if (monitored) {
            Bundle extras = notification.extras;
            CharSequence title = extras != null ? extras.getCharSequence(Notification.EXTRA_TITLE) : null;
            CharSequence text = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;
            item.put("title", title != null ? title.toString() : "");
            item.put("text", text != null ? text.toString() : "");
        } else {
            item.put("title", "");
            item.put("text", "");
        }

        synchronized (AppNotificationListenerService.class) {
            cache.addFirst(item);
            while (cache.size() > MAX_CACHED) {
                cache.removeLast();
            }
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Mantemos o histórico mesmo depois que a notificação some da barra do sistema — o
        // objetivo aqui é revisar o que chegou, não espelhar o estado atual da barra.
    }

    private String resolveAppName(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            return pm.getApplicationLabel(info).toString();
        } catch (Exception e) {
            return packageName;
        }
    }
}
