package com.lembretes.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Ponte entre o app (TypeScript) e o widget de lembretes da tela inicial. O widget roda num
 * processo separado da WebView e não enxerga o localStorage, então o lado JS empurra a lista já
 * pronta (título + horário formatado) pra cá, que só grava em SharedPreferences e pede pro
 * AppWidgetProvider redesenhar.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void syncReminders(PluginCall call) {
        JSArray itemsArray = call.getArray("items");
        JSONArray jsonItems = new JSONArray();

        if (itemsArray != null) {
            try {
                for (int i = 0; i < itemsArray.length(); i++) {
                    JSONObject item = itemsArray.getJSONObject(i);
                    JSONObject out = new JSONObject();
                    out.put("title", item.optString("title", ""));
                    out.put("time", item.optString("time", ""));
                    jsonItems.put(out);
                }
            } catch (JSONException e) {
                call.reject("Lista de lembretes inválida", e);
                return;
            }
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(ReminderWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(ReminderWidgetProvider.KEY_ITEMS_JSON, jsonItems.toString()).apply();

        ReminderWidgetProvider.updateAll(context);
        call.resolve();
    }
}
