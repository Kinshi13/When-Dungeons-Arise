package com.guildadeaventureiros.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
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

private data class PortraitTab(val drawableRes: Int, val label: String, val pageIndex: Int)

// Ordem visual da barra (recepção sempre ao centro); pageIndex preserva o índice real do HorizontalPager.
private val portraitTabs = listOf(
    PortraitTab(R.drawable.portrait_treasurer, "Tesouraria", pageIndex = 1),
    PortraitTab(R.drawable.portrait_receptionist, "Recepção", pageIndex = 0),
    PortraitTab(R.drawable.portrait_librarian, "Biblioteca", pageIndex = 2),
)

/** Barra inferior persistente com miniaturas em retrato das 3 personagens — navega entre as áreas. */
@Composable
fun CharacterPortraitBar(
    currentPage: Int,
    onSelectPage: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxWidth().aspectRatio(2172f / 724f)) {
        Image(
            painter = painterResource(R.drawable.nav_bar_banner),
            contentDescription = null,
            contentScale = ContentScale.FillBounds,
            modifier = Modifier.fillMaxSize(),
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 24.dp),
            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            portraitTabs.forEach { tab ->
                val selected = tab.pageIndex == currentPage
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
                        .clickable { onSelectPage(tab.pageIndex) },
                )
            }
        }
    }
}
