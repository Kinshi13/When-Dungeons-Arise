package com.guildadeaventureiros.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.ui.theme.GuildColors

/** Balão de fala estilo pergaminho — usado para o diálogo dos NPCs (recepcionista, tesoureira, bibliotecária). */
@Composable
fun PixelDialogBox(
    text: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        color = GuildColors.Parchment,
        contentColor = GuildColors.TextOnParchment,
        shape = RoundedCornerShape(4.dp),
        border = BorderStroke(2.dp, GuildColors.WoodDark),
        modifier = modifier,
    ) {
        Text(text, modifier = Modifier.padding(12.dp))
    }
}

/**
 * Variante sem fundo próprio — usada quando o balão já está pintado na arte de fundo
 * (ex.: recepção) e só precisamos encaixar o texto dentro dele.
 */
@Composable
fun PainterlyDialogText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.bodyMedium,
) {
    Text(
        text = text,
        modifier = modifier,
        color = GuildColors.TextOnParchment,
        style = style,
        textAlign = TextAlign.Center,
    )
}
