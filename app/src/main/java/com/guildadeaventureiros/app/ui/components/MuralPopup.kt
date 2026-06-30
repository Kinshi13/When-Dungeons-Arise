package com.guildadeaventureiros.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.R
import com.guildadeaventureiros.app.ui.theme.GuildColors

/**
 * Popup do mural — abre com zoom-in suave sobre a arte detalhada do quadro de avisos.
 * As folhas de pergaminho funcionam como hiperlinks para Tarefas e Configurações.
 */
@Composable
fun MuralPopup(
    visible: Boolean,
    onDismiss: () -> Unit,
    onOpenTasks: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn() + scaleIn(initialScale = 0.85f),
        exit = fadeOut() + scaleOut(targetScale = 0.85f),
        modifier = modifier,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.75f))
                .clickable(onClick = onDismiss),
            contentAlignment = Alignment.Center,
        ) {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth(0.88f)
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(6.dp))
                    .clickable(enabled = false) {},
            ) {
                Image(
                    painter = painterResource(R.drawable.mural_board),
                    contentDescription = null,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize(),
                )

                MuralHyperlink(
                    label = "TAREFAS",
                    onClick = onOpenTasks,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = maxWidth * 0.345f, y = maxHeight * 0.40f)
                        .size(width = maxWidth * 0.30f, height = maxHeight * 0.10f),
                )

                MuralHyperlink(
                    label = "CONFIG.",
                    onClick = onOpenSettings,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = maxWidth * 0.645f, y = maxHeight * 0.335f)
                        .size(width = maxWidth * 0.165f, height = maxHeight * 0.10f),
                )
            }
        }
    }
}

@Composable
private fun MuralHyperlink(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = GuildColors.WoodDark,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.labelLarge,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(2.dp),
        )
    }
}
