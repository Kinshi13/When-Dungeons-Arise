package com.guildadeaventureiros.app.ui.reception

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.R
import com.guildadeaventureiros.app.ui.components.GameTopBar
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.components.PixelDialogBox
import com.guildadeaventureiros.app.ui.components.RewardPopup
import com.guildadeaventureiros.app.ui.components.SceneBackground
import com.guildadeaventureiros.app.ui.rememberAppContainer

/** Tela inicial — recepção da guilda, com a recepcionista e o acesso ao mural de missões. */
@Composable
fun GuildReceptionScreen(
    onOpenMissionBoard: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val container = rememberAppContainer()
    val viewModel: ReceptionViewModel = viewModel(
        factory = ReceptionViewModelFactory(container.missionRepository, container.gameProfileRepository),
    )
    val profile by viewModel.profile.collectAsState()
    val missions by viewModel.missions.collectAsState()
    val rewardResult by viewModel.rewardResult.collectAsState()

    val pendingCount = missions.count { it.status != com.guildadeaventureiros.app.domain.model.MissionStatus.COMPLETED }

    SceneBackground(backgroundRes = R.drawable.bg_reception, modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            GameTopBar(profile = profile)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                PixelDialogBox(
                    text = if (pendingCount > 0) {
                        "Bem-vindo de volta, aventureiro! Temos $pendingCount missão(ões) esperando por você no mural."
                    } else {
                        "Bem-vindo de volta, aventureiro! O mural está limpo por enquanto."
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Bottom,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(text = "Sequência diária: ${profile.dailyStreak} dia(s)")
            PixelButton(
                text = "Mural de Missões",
                onClick = onOpenMissionBoard,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
            )
        }
    }

    RewardPopup(result = rewardResult, onDismiss = viewModel::dismissReward)
}
