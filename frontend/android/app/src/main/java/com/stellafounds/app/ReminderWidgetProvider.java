package com.stellafounds.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Widget de tela inicial só informativo: mostra os próximos lembretes salvos pelo
 * WidgetBridgePlugin em SharedPreferences (o widget roda num processo separado da WebView,
 * não tem acesso ao localStorage do app). Tocar em qualquer parte do widget abre o app.
 */
public class ReminderWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "com.stellafounds.app.widget";
    static final String KEY_ITEMS_JSON = "reminders_items_json";
    private static final int MAX_ROWS = 5;

    private static final int[] ROW_IDS = {
        R.id.widget_row1,
        R.id.widget_row2,
        R.id.widget_row3,
        R.id.widget_row4,
        R.id.widget_row5,
    };
    private static final int[] TITLE_IDS = {
        R.id.widget_row1_title,
        R.id.widget_row2_title,
        R.id.widget_row3_title,
        R.id.widget_row4_title,
        R.id.widget_row5_title,
    };
    private static final int[] TIME_IDS = {
        R.id.widget_row1_time,
        R.id.widget_row2_time,
        R.id.widget_row3_time,
        R.id.widget_row4_time,
        R.id.widget_row5_time,
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    /** Chamado pelo WidgetBridgePlugin sempre que os lembretes mudam no lado JS. */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, ReminderWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int appWidgetId : ids) {
            updateWidget(context, manager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_reminders);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String itemsJson = prefs.getString(KEY_ITEMS_JSON, "[]");

        JSONArray items;
        try {
            items = new JSONArray(itemsJson);
        } catch (JSONException e) {
            items = new JSONArray();
        }

        int count = Math.min(items.length(), MAX_ROWS);
        views.setViewVisibility(R.id.widget_empty, count == 0 ? android.view.View.VISIBLE : android.view.View.GONE);

        for (int i = 0; i < MAX_ROWS; i++) {
            if (i < count) {
                JSONObject item = items.optJSONObject(i);
                String title = item != null ? item.optString("title", "") : "";
                String time = item != null ? item.optString("time", "") : "";
                views.setViewVisibility(ROW_IDS[i], android.view.View.VISIBLE);
                views.setTextViewText(TITLE_IDS[i], title);
                views.setTextViewText(TIME_IDS[i], time);
            } else {
                views.setViewVisibility(ROW_IDS[i], android.view.View.GONE);
            }
        }

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
