package com.guildadeaventureiros.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.ui.theme.GuildColors

@Composable
fun PixelButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()

    Button(
        onClick = onClick,
        enabled = enabled,
        interactionSource = interactionSource,
        shape = RoundedCornerShape(2.dp),
        border = BorderStroke(2.dp, GuildColors.Gold),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (pressed) GuildColors.WoodDark else GuildColors.WoodMid,
            contentColor = GuildColors.Gold,
            disabledContainerColor = GuildColors.WoodDark,
            disabledContentColor = GuildColors.Gold.copy(alpha = 0.4f),
        ),
        modifier = modifier,
    ) {
        Text(text)
    }
}
