package com.guildadeaventureiros.app.ui.reception

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.R
import com.guildadeaventureiros.app.ui.components.GameTopBar
import com.guildadeaventureiros.app.ui.components.MuralPopup
import com.guildadeaventureiros.app.ui.components.PainterlyDialogText
import com.guildadeaventureiros.app.ui.components.RewardPopup
import com.guildadeaventureiros.app.ui.components.SceneBackground
import com.guildadeaventureiros.app.ui.rememberAppContainer
import com.guildadeaventureiros.app.ui.theme.GuildColors

/** Tela inicial — recepção da guilda, com a recepcionista, o balão de fala e o mural de missões. */
@Composable
fun GuildReceptionScreen(
    onOpenMissionBoard: () -> Unit,
    onOpenSettings: () -> Unit,
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
    var muralOpen by remember { mutableStateOf(false) }

    SceneBackground(backgroundRes = R.drawable.bg_reception, modifier = modifier.fillMaxSize()) {
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            GameTopBar(profile = profile, modifier = Modifier.align(Alignment.TopCenter))

            // Texto encaixado dentro do balão de fala já pintado na arte de fundo.
            PainterlyDialogText(
                text = if (pendingCount > 0) {
                    "Bem-vindo! $pendingCount missão(ões) no mural."
                } else {
                    "Bem-vindo! Mural limpo por enquanto."
                },
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 9.sp, lineHeight = 10.5.sp),
                maxLines = 4,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .offset(x = maxWidth * 0.575f, y = maxHeight * 0.242f)
                    .size(width = maxWidth * 0.25f, height = maxHeight * 0.05f)
                    .padding(horizontal = 3.dp),
            )

            // Área tocável sobre o quadro de avisos pintado na parede — abre o mural com zoom-in.
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .offset(x = maxWidth * 0.09f, y = maxHeight * 0.205f)
                    .size(width = maxWidth * 0.45f, height = maxHeight * 0.235f)
                    .clickable { muralOpen = true },
            )

            Text(
                text = "Sequência diária: ${profile.dailyStreak} dia(s)",
                color = GuildColors.TextOnDark,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp),
            )
        }
    }

    MuralPopup(
        visible = muralOpen,
        onDismiss = { muralOpen = false },
        onOpenTasks = {
            muralOpen = false
            onOpenMissionBoard()
        },
        onOpenSettings = {
            muralOpen = false
            onOpenSettings()
        },
    )

    RewardPopup(result = rewardResult, onDismiss = viewModel::dismissReward)
}
