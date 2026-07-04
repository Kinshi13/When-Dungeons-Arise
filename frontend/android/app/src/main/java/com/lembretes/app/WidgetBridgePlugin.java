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

    @PluginMethod
    public void syncCalendar(PluginCall call) {
        String monthLabel = call.getString("monthLabel", "");
        JSArray cellsArray = call.getArray("cells");
        JSONArray jsonCells = new JSONArray();

        if (cellsArray != null) {
            try {
                for (int i = 0; i < cellsArray.length(); i++) {
                    JSONObject cell = cellsArray.getJSONObject(i);
                    JSONObject out = new JSONObject();
                    if (cell.isNull("day")) {
                        out.put("day", JSONObject.NULL);
                    } else {
                        out.put("day", cell.optInt("day"));
                    }
                    out.put("hasEvents", cell.optBoolean("hasEvents", false));
                    out.put("isToday", cell.optBoolean("isToday", false));
                    jsonCells.put(out);
                }
            } catch (JSONException e) {
                call.reject("Dados de calendário inválidos", e);
                return;
            }
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(CalendarWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(CalendarWidgetProvider.KEY_MONTH_LABEL, monthLabel)
            .putString(CalendarWidgetProvider.KEY_CELLS_JSON, jsonCells.toString())
            .apply();

        CalendarWidgetProvider.updateAll(context);
        call.resolve();
    }

    @PluginMethod
    public void syncCurrencyPair(PluginCall call) {
        String pair = call.getString("pair", "USD-BRL");
        String label = call.getString("label", "Dólar (USD)");

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(CurrencyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(CurrencyWidgetProvider.KEY_PAIR, pair)
            .putString(CurrencyWidgetProvider.KEY_PAIR_LABEL, label)
            .apply();

        // Muda o par exibido na hora e já dispara uma busca nova (a cotação salva era de outro
        // par, não serve mais).
        CurrencyWidgetProvider.refreshNow(context);
        call.resolve();
    }
}
