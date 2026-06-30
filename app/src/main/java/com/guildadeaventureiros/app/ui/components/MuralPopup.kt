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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.R

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
                    iconRes = R.drawable.icon_tarefas,
                    contentDescription = "Tarefas",
                    onClick = onOpenTasks,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = maxWidth * 0.41f, y = maxHeight * 0.28f)
                        .size(width = maxWidth * 0.19f, height = maxHeight * 0.28f),
                )

                MuralHyperlink(
                    iconRes = R.drawable.icon_config,
                    contentDescription = "Configurações",
                    onClick = onOpenSettings,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = maxWidth * 0.71f, y = maxHeight * 0.28f)
                        .size(width = maxWidth * 0.17f, height = maxHeight * 0.17f),
                )
            }
        }
    }
}

@Composable
private fun MuralHyperlink(
    iconRes: Int,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(iconRes),
            contentDescription = contentDescription,
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxWidth(0.78f)
                .aspectRatio(1f),
        )
    }
}
