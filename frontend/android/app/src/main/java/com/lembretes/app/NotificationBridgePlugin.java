package com.lembretes.app;

import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
}
