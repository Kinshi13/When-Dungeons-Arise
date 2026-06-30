package com.guildadeaventureiros.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.domain.leveling.LevelTable
import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.ui.theme.GuildColors

/** Cabeçalho fixo com nível, barra de XP e moedas — exibido no topo das 3 áreas da guilda. */
@Composable
fun GameTopBar(
    profile: GameProfile,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(GuildColors.WoodMid)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Nv. ${profile.level}",
            color = GuildColors.Gold,
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 12.dp),
        ) {
            PixelProgressBar(
                progress = LevelTable.xpIntoCurrentLevel(profile.xp).toFloat() / LevelTable.xpForNextLevel(),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Text(
            text = "${profile.coins} 🪙",
            color = GuildColors.Gold,
            modifier = Modifier.width(72.dp),
        )
    }
}
