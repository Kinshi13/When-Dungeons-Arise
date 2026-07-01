package com.lembretes.app;

import android.app.Notification;
import android.content.Context;
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

/**
 * Serviço que escuta as notificações do sistema em segundo plano — só funciona depois que o
 * usuário ativa manualmente o acesso em Ajustes > Apps > Acesso especial > Acesso a notificações
 * (o Android não deixa pedir essa permissão por um diálogo comum, é uma decisão explícita do
 * usuário, igual acessibilidade). Guarda um cache simples em memória; o NotificationBridgePlugin
 * lê esse cache sob demanda quando a tela de gerenciamento pede (modelo "pull", sem push em
 * tempo real por enquanto).
 */
public class AppNotificationListenerService extends NotificationListenerService {

    private static final int MAX_CACHED = 100;
    private static final Deque<JSObject> cache = new ArrayDeque<>();

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

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        Notification notification = sbn.getNotification();
        if (notification == null) return;
        Bundle extras = notification.extras;
        CharSequence title = extras != null ? extras.getCharSequence(Notification.EXTRA_TITLE) : null;
        CharSequence text = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;

        JSObject item = new JSObject();
        item.put("id", sbn.getKey());
        item.put("packageName", sbn.getPackageName());
        item.put("appName", resolveAppName(sbn.getPackageName()));
        item.put("title", title != null ? title.toString() : "");
        item.put("text", text != null ? text.toString() : "");
        item.put("postTime", sbn.getPostTime());

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
