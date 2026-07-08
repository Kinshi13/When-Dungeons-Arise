package com.stellafounds.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONObject;

/**
 * Widget de tela inicial só informativo: cotação de uma moeda em relação ao Real, com o par
 * escolhido pelo usuário nas configurações do app. Diferente dos widgets de Lembretes e
 * Calendário (que só espelham dados que o app já tem), este busca a cotação sozinho, direto da
 * AwesomeAPI (gratuita, sem chave) — tanto quando o app avisa que o par mudou quanto no ciclo
 * automático do próprio widget (updatePeriodMillis), pra continuar atualizando mesmo com o app
 * fechado. Tocar em qualquer parte do widget abre o app.
 */
public class CurrencyWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "com.stellafounds.app.widget";
    static final String KEY_PAIR = "currency_pair";
    static final String KEY_PAIR_LABEL = "currency_pair_label";
    static final String KEY_QUOTE_VALUE = "currency_quote_value";
    static final String KEY_QUOTE_CHANGE = "currency_quote_change";
    static final String KEY_QUOTE_UPDATED_AT = "currency_quote_updated_at";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            renderWidget(context, appWidgetManager, appWidgetId);
        }
        // goAsync segura o processo vivo até a busca de rede terminar — sem isso o sistema pode
        // matar o processo assim que onUpdate retornar, antes da resposta HTTP chegar.
        final PendingResult pendingResult = goAsync();
        fetchAndUpdate(context, pendingResult);
    }

    /** Chamado pelo WidgetBridgePlugin quando o usuário troca o par nas configurações do app. */
    static void refreshNow(Context context) {
        renderAll(context);
        fetchAndUpdate(context, null);
    }

    private static void renderAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, CurrencyWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int appWidgetId : ids) {
            renderWidget(context, manager, appWidgetId);
        }
    }

    private static void renderWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_currency);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String pairLabel = prefs.getString(KEY_PAIR_LABEL, "Dólar (USD)");
        String value = prefs.getString(KEY_QUOTE_VALUE, "--");
        String change = prefs.getString(KEY_QUOTE_CHANGE, "");
        String updatedAt = prefs.getString(KEY_QUOTE_UPDATED_AT, "");

        views.setTextViewText(R.id.widget_currency_pair, pairLabel);
        views.setTextViewText(R.id.widget_currency_value, value);
        views.setTextViewText(R.id.widget_currency_change, change);
        views.setTextViewText(R.id.widget_currency_updated, updatedAt.isEmpty() ? "" : "Atualizado " + updatedAt);

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                2,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void fetchAndUpdate(Context context, PendingResult pendingResult) {
        Thread thread = new Thread(() -> {
            try {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String pair = prefs.getString(KEY_PAIR, "USD-BRL");

                URL url = new URL("https://economia.awesomeapi.com.br/last/" + pair);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                conn.setRequestMethod("GET");

                StringBuilder body = new StringBuilder();
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) body.append(line);
                reader.close();
                conn.disconnect();

                // A AwesomeAPI usa o par sem hífen como chave do objeto (ex: "USD-BRL" -> "USDBRL").
                String key = pair.replace("-", "");
                JSONObject root = new JSONObject(body.toString());
                JSONObject quote = root.getJSONObject(key);

                double bid = Double.parseDouble(quote.getString("bid"));
                double pctChange = Double.parseDouble(quote.getString("pctChange"));

                NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
                String value = currencyFormat.format(bid);
                String change = String.format(Locale.forLanguageTag("pt-BR"), "%+.2f%%", pctChange);
                String updatedAt = new SimpleDateFormat("HH:mm", new Locale("pt", "BR")).format(new Date());

                prefs.edit()
                    .putString(KEY_QUOTE_VALUE, value)
                    .putString(KEY_QUOTE_CHANGE, change)
                    .putString(KEY_QUOTE_UPDATED_AT, updatedAt)
                    .apply();

                renderAll(context);
            } catch (Exception e) {
                // Sem rede ou API fora do ar — mantém a última cotação salva, não derruba o widget.
            } finally {
                if (pendingResult != null) pendingResult.finish();
            }
        });
        thread.setDaemon(true);
        thread.start();
    }
}
