package com.guildadeaventureiros.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.R
import com.guildadeaventureiros.app.ui.theme.GuildColors

private data class PortraitTab(val drawableRes: Int, val label: String)

private val portraitTabs = listOf(
    PortraitTab(R.drawable.portrait_receptionist, "Recepção"),
    PortraitTab(R.drawable.portrait_treasurer, "Tesouraria"),
    PortraitTab(R.drawable.portrait_librarian, "Biblioteca"),
)

/** Barra inferior persistente com miniaturas em retrato das 3 personagens — navega entre as áreas. */
@Composable
fun CharacterPortraitBar(
    currentPage: Int,
    onSelectPage: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(GuildColors.WoodDark.copy(alpha = 0.85f))
            .padding(vertical = 8.dp, horizontal = 24.dp),
        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        portraitTabs.forEachIndexed { index, tab ->
            val selected = index == currentPage
            Image(
                painter = painterResource(tab.drawableRes),
                contentDescription = tab.label,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(if (selected) 52.dp else 42.dp)
                    .clip(CircleShape)
                    .border(
                        width = if (selected) 3.dp else 1.dp,
                        color = if (selected) GuildColors.Gold else GuildColors.WoodMid,
                        shape = CircleShape,
                    )
                    .clickable { onSelectPage(index) },
            )
        }
    }
}
