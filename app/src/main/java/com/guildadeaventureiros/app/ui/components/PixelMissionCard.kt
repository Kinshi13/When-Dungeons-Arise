package com.guildadeaventureiros.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.domain.model.Mission
import com.guildadeaventureiros.app.domain.model.MissionDifficulty
import com.guildadeaventureiros.app.ui.theme.GuildColors

private fun difficultyLabel(difficulty: MissionDifficulty): String = when (difficulty) {
    MissionDifficulty.SIMPLE -> "Simples"
    MissionDifficulty.MEDIUM -> "Média"
    MissionDifficulty.IMPORTANT -> "Importante"
}

private fun difficultyColor(difficulty: MissionDifficulty) = when (difficulty) {
    MissionDifficulty.SIMPLE -> GuildColors.Blue
    MissionDifficulty.MEDIUM -> GuildColors.Purple
    MissionDifficulty.IMPORTANT -> GuildColors.Gold
}

/** Cartão de missão estilo mural da guilda — usado no quadro de missões da Recepção. */
@Composable
fun PixelMissionCard(
    mission: Mission,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    Surface(
        color = GuildColors.Parchment,
        contentColor = GuildColors.TextOnParchment,
        shape = RoundedCornerShape(2.dp),
        border = BorderStroke(2.dp, GuildColors.WoodDark),
        modifier = modifier.fillMaxWidth(),
        onClick = { onClick?.invoke() },
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(text = mission.title)
                Surface(
                    color = difficultyColor(mission.difficulty),
                    contentColor = GuildColors.TextOnDark,
                    shape = RoundedCornerShape(2.dp),
                ) {
                    Text(
                        text = difficultyLabel(mission.difficulty),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                    )
                }
            }
            mission.description?.let { description ->
                Text(text = description, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}
