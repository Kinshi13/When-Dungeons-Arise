package com.stellafounds.app;

import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONException;

/**
 * Ponte entre a tela de gerenciamento de notificações (TypeScript) e o
 * AppNotificationListenerService. Fica pronto pra quando o acesso a notificações for testado num
 * aparelho de verdade — não dá pra validar o comportamento em tempo de execução neste ambiente
 * (sem emulador/aparelho Android), só a compilação.
 */
@CapacitorPlugin(name = "NotificationBridge")
public class NotificationBridgePlugin extends Plugin {

    @PluginMethod
    public void isAccessGranted(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", AppNotificationListenerService.isAccessGranted(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getRecentNotifications(PluginCall call) {
        JSArray items = AppNotificationListenerService.getCachedNotifications();
        JSObject ret = new JSObject();
        ret.put("items", items);
        call.resolve(ret);
    }

    /**
     * Recebe do lado TypeScript a lista de pacotes que o usuário marcou como "Monitorar" em
     * Ajustes. Só esses apps têm título/texto de notificação guardados pelo
     * AppNotificationListenerService — os demais ficam de fora do conteúdo, só com nome/pacote
     * pra aparecer na lista de Ajustes.
     */
    @PluginMethod
    public void setMonitoredPackages(PluginCall call) {
        JSArray packagesArray = call.getArray("packages");
        List<String> packages = new ArrayList<>();
        if (packagesArray != null) {
            try {
                for (int i = 0; i < packagesArray.length(); i++) {
                    packages.add(packagesArray.getString(i));
                }
            } catch (JSONException e) {
                call.reject("Lista de pacotes inválida", e);
                return;
            }
        }
        AppNotificationListenerService.setMonitoredPackages(getContext(), packages);
        call.resolve();
    }
}
