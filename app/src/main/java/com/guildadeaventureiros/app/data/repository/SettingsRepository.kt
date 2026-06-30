package com.guildadeaventureiros.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.guildadeaventureiros.app.domain.model.AppSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

private const val PREFS_NAME = "guilda_settings"
private const val KEY_AUDIO = "audio_enabled"
private const val KEY_NOTIFICATIONS = "notifications_enabled"
private const val KEY_ANIMATIONS = "animations_enabled"
private const val KEY_APP_DIRECTORY = "app_directory"

/** Preferências simples persistidas em SharedPreferences — sem necessidade de banco relacional. */
class SettingsRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val default = AppSettings()

    private val _settings = MutableStateFlow(load())
    val settings: StateFlow<AppSettings> = _settings.asStateFlow()

    private fun load() = AppSettings(
        audioEnabled = prefs.getBoolean(KEY_AUDIO, default.audioEnabled),
        notificationsEnabled = prefs.getBoolean(KEY_NOTIFICATIONS, default.notificationsEnabled),
        animationsEnabled = prefs.getBoolean(KEY_ANIMATIONS, default.animationsEnabled),
        appDirectory = prefs.getString(KEY_APP_DIRECTORY, default.appDirectory) ?: default.appDirectory,
    )

    fun setAudioEnabled(enabled: Boolean) {
        prefs.edit { putBoolean(KEY_AUDIO, enabled) }
        _settings.value = _settings.value.copy(audioEnabled = enabled)
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        prefs.edit { putBoolean(KEY_NOTIFICATIONS, enabled) }
        _settings.value = _settings.value.copy(notificationsEnabled = enabled)
    }

    fun setAnimationsEnabled(enabled: Boolean) {
        prefs.edit { putBoolean(KEY_ANIMATIONS, enabled) }
        _settings.value = _settings.value.copy(animationsEnabled = enabled)
    }

    fun setAppDirectory(directory: String) {
        prefs.edit { putString(KEY_APP_DIRECTORY, directory) }
        _settings.value = _settings.value.copy(appDirectory = directory)
    }
}
