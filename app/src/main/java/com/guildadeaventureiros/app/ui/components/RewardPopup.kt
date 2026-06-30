package com.guildadeaventureiros.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.domain.reward.RewardResult
import com.guildadeaventureiros.app.ui.theme.GuildColors

/** Popup de recompensa exibido ao concluir missões, registrar gastos, pagar contas ou ler. */
@Composable
fun RewardPopup(
    result: RewardResult?,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AnimatedVisibility(
        visible = result != null,
        enter = fadeIn() + scaleIn(initialScale = 0.8f),
        exit = fadeOut() + scaleOut(targetScale = 0.8f),
        modifier = modifier,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.6f)),
            contentAlignment = Alignment.Center,
        ) {
            Surface(
                color = GuildColors.Parchment,
                contentColor = GuildColors.TextOnParchment,
                shape = RoundedCornerShape(4.dp),
                border = BorderStroke(2.dp, GuildColors.Gold),
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    if (result != null) {
                        if (result.leveledUp) {
                            Text(text = "Subiu de nível!", color = GuildColors.Purple)
                        }
                        Text(text = "+${result.delta.xp} XP")
                        Text(text = "+${result.delta.coins} moedas")
                        Text(text = "Nível atual: ${result.newLevel}")
                    }
                    PixelButton(
                        text = "OK",
                        onClick = onDismiss,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                }
            }
        }
    }
}
