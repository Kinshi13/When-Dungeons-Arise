package com.guildadeaventureiros.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.rememberAppContainer
import com.guildadeaventureiros.app.ui.theme.GuildColors

/** Tela de Configurações — áudio, notificações, animações e diretório principal do app. */
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val container = rememberAppContainer()
    val viewModel: SettingsViewModel = viewModel(
        factory = SettingsViewModelFactory(container.settingsRepository),
    )
    val settings by viewModel.settings.collectAsState()
    var directoryDraft by remember(settings.appDirectory) { mutableStateOf(settings.appDirectory) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(GuildColors.WoodDark)
            .padding(16.dp),
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "Configurações", style = MaterialTheme.typography.titleMedium, color = GuildColors.Gold)
            PixelButton(text = "Voltar", onClick = onBack)
        }

        Column(
            modifier = Modifier.padding(top = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            SettingToggleRow(
                label = "Áudio",
                checked = settings.audioEnabled,
                onCheckedChange = viewModel::setAudioEnabled,
            )
            SettingToggleRow(
                label = "Notificação",
                checked = settings.notificationsEnabled,
                onCheckedChange = viewModel::setNotificationsEnabled,
            )
            SettingToggleRow(
                label = "Animação",
                checked = settings.animationsEnabled,
                onCheckedChange = viewModel::setAnimationsEnabled,
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text = "Diretório principal do app", color = GuildColors.TextOnDark)
                OutlinedTextField(
                    value = directoryDraft,
                    onValueChange = { directoryDraft = it },
                    modifier = Modifier.fillMaxWidth(),
                )
                PixelButton(
                    text = "Salvar diretório",
                    enabled = directoryDraft.isNotBlank() && directoryDraft != settings.appDirectory,
                    onClick = { viewModel.setAppDirectory(directoryDraft.trim()) },
                )
            }
        }
    }
}

@Composable
private fun SettingToggleRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = label, color = GuildColors.TextOnDark, style = MaterialTheme.typography.bodyLarge)
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = GuildColors.Gold,
                checkedTrackColor = GuildColors.Purple,
                uncheckedThumbColor = GuildColors.Parchment,
                uncheckedTrackColor = GuildColors.WoodMid,
            ),
        )
    }
}
