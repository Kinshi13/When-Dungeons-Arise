package com.guildadeaventureiros.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.guildadeaventureiros.app.data.repository.SettingsRepository
import com.guildadeaventureiros.app.domain.model.AppSettings
import kotlinx.coroutines.flow.StateFlow

class SettingsViewModel(private val settingsRepository: SettingsRepository) : ViewModel() {

    val settings: StateFlow<AppSettings> = settingsRepository.settings

    fun setAudioEnabled(enabled: Boolean) = settingsRepository.setAudioEnabled(enabled)

    fun setNotificationsEnabled(enabled: Boolean) = settingsRepository.setNotificationsEnabled(enabled)

    fun setAnimationsEnabled(enabled: Boolean) = settingsRepository.setAnimationsEnabled(enabled)

    fun setAppDirectory(directory: String) = settingsRepository.setAppDirectory(directory)
}

class SettingsViewModelFactory(
    private val settingsRepository: SettingsRepository,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return SettingsViewModel(settingsRepository) as T
    }
}
