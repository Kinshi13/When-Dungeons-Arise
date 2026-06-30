package com.guildadeaventureiros.app.ui.reception

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.domain.model.Mission
import com.guildadeaventureiros.app.domain.model.MissionDifficulty
import com.guildadeaventureiros.app.domain.model.MissionStatus
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.components.PixelMissionCard
import com.guildadeaventureiros.app.ui.components.RewardPopup
import com.guildadeaventureiros.app.ui.rememberAppContainer

/** Mural de missões — criar, aceitar e concluir tarefas que rendem XP e moedas. */
@Composable
fun MissionBoardScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val container = rememberAppContainer()
    val viewModel: ReceptionViewModel = viewModel(
        factory = ReceptionViewModelFactory(container.missionRepository, container.gameProfileRepository),
    )
    val missions by viewModel.missions.collectAsState()
    val rewardResult by viewModel.rewardResult.collectAsState()

    var title by remember { mutableStateOf("") }
    var difficulty by remember { mutableStateOf(MissionDifficulty.SIMPLE) }

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "Mural de Missões")
            PixelButton(text = "Voltar", onClick = onBack)
        }

        Column(modifier = Modifier.padding(vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Nova missão") },
                modifier = Modifier.fillMaxWidth(),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MissionDifficulty.entries.forEach { option ->
                    PixelButton(
                        text = when (option) {
                            MissionDifficulty.SIMPLE -> "Simples"
                            MissionDifficulty.MEDIUM -> "Média"
                            MissionDifficulty.IMPORTANT -> "Importante"
                        },
                        onClick = { difficulty = option },
                        enabled = difficulty != option,
                    )
                }
            }
            PixelButton(
                text = "Criar missão",
                enabled = title.isNotBlank(),
                onClick = {
                    viewModel.createMission(title.trim(), null, difficulty, null)
                    title = ""
                },
                modifier = Modifier.fillMaxWidth(),
            )
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(missions, key = { it.id }) { mission ->
                MissionRow(
                    mission = mission,
                    onAccept = { viewModel.acceptMission(mission.id) },
                    onComplete = { viewModel.completeMission(mission.id) },
                )
            }
        }
    }

    RewardPopup(result = rewardResult, onDismiss = viewModel::dismissReward)
}

@Composable
private fun MissionRow(mission: Mission, onAccept: () -> Unit, onComplete: () -> Unit) {
    Column {
        PixelMissionCard(mission = mission)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
            when (mission.status) {
                MissionStatus.PENDING -> PixelButton(text = "Aceitar", onClick = onAccept)
                MissionStatus.ACCEPTED -> PixelButton(text = "Concluir", onClick = onComplete)
                MissionStatus.COMPLETED -> Text(text = if (mission.completedLate) "Concluída (atrasada)" else "Concluída")
            }
        }
    }
}
