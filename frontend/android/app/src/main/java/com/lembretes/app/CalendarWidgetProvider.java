package com.lembretes.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Widget de tela inicial só informativo: mini calendário do mês atual, com uma bolinha nos dias
 * que têm lembrete, conta ou feriado (mesma fonte de dados da tela de Calendário do app) e o dia
 * de hoje destacado. Tocar em qualquer parte do widget abre o app — não há toque por dia.
 */
public class CalendarWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "com.lembretes.app.widget";
    static final String KEY_MONTH_LABEL = "calendar_month_label";
    static final String KEY_CELLS_JSON = "calendar_cells_json";
    private static final int CELL_COUNT = 42;

    // As 42 células têm ids gerados em sequência (widget_cal_c0_day .. widget_cal_c41_day) —
    // resolvidos pelo nome via getIdentifier em vez de listar os 84 ids à mão aqui.
    private static int dayViewId(Context context, int index) {
        return context.getResources().getIdentifier("widget_cal_c" + index + "_day", "id", context.getPackageName());
    }

    private static int dotViewId(Context context, int index) {
        return context.getResources().getIdentifier("widget_cal_c" + index + "_dot", "id", context.getPackageName());
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    /** Chamado pelo WidgetBridgePlugin sempre que reminders ou bills mudam no lado JS. */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, CalendarWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int appWidgetId : ids) {
            updateWidget(context, manager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String monthLabel = prefs.getString(KEY_MONTH_LABEL, "");
        String cellsJson = prefs.getString(KEY_CELLS_JSON, "[]");

        views.setTextViewText(R.id.widget_calendar_title, monthLabel);

        JSONArray cells;
        try {
            cells = new JSONArray(cellsJson);
        } catch (JSONException e) {
            cells = new JSONArray();
        }

        int textColor = ContextCompat.getColor(context, R.color.widget_text);
        int accentColor = ContextCompat.getColor(context, R.color.widget_accent);

        for (int i = 0; i < CELL_COUNT; i++) {
            int dayId = dayViewId(context, i);
            int dotId = dotViewId(context, i);
            if (dayId == 0 || dotId == 0) continue;

            JSONObject cell = cells.optJSONObject(i);
            boolean hasDay = cell != null && !cell.isNull("day");

            if (!hasDay) {
                views.setTextViewText(dayId, "");
                views.setViewVisibility(dotId, android.view.View.GONE);
                continue;
            }

            int day = cell.optInt("day", 0);
            boolean hasEvents = cell.optBoolean("hasEvents", false);
            boolean isToday = cell.optBoolean("isToday", false);

            views.setTextViewText(dayId, String.valueOf(day));
            views.setInt(dayId, "setTextColor", isToday ? accentColor : textColor);
            views.setViewVisibility(dotId, hasEvents ? android.view.View.VISIBLE : android.view.View.GONE);
        }

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                1,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
