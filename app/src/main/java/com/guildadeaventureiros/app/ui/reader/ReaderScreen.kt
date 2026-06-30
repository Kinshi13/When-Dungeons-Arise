package com.guildadeaventureiros.app.ui.reader

import android.graphics.Bitmap
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.domain.model.DocumentType
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.components.RewardPopup
import com.guildadeaventureiros.app.ui.rememberAppContainer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/** Leitor — toque na direita avança, na esquerda volta, duplo toque alterna o zoom. */
@Composable
fun ReaderScreen(
    itemId: Long,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val container = rememberAppContainer()
    val viewModel: ReaderViewModel = viewModel(
        factory = ReaderViewModelFactory(container.libraryRepository, itemId),
    )
    val item by viewModel.item.collectAsState()
    val progress by viewModel.progress.collectAsState()
    val rewardResult by viewModel.rewardResult.collectAsState()

    Column(modifier = modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(text = item?.title ?: "Carregando...")
            PixelButton(text = "Voltar", onClick = onBack)
        }

        val currentItem = item
        if (currentItem != null) {
            when (currentItem.type) {
                DocumentType.PDF -> PdfReaderContent(
                    file = File(currentItem.filePath),
                    initialPage = progress?.lastPage ?: 0,
                    onPageChanged = viewModel::updatePage,
                    modifier = Modifier.fillMaxSize(),
                )
                DocumentType.EPUB -> EpubReaderContent(
                    file = File(currentItem.filePath),
                    initialPage = progress?.lastPage ?: 0,
                    onPageChanged = viewModel::updatePage,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }

    RewardPopup(result = rewardResult, onDismiss = viewModel::dismissReward)
}

@Composable
private fun PdfReaderContent(
    file: File,
    initialPage: Int,
    onPageChanged: (page: Int, total: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val renderer = remember(file) { PdfPageRenderer(file) }
    DisposableEffect(renderer) {
        onDispose { renderer.close() }
    }
    var pageIndex by remember { mutableStateOf(initialPage.coerceIn(0, (renderer.pageCount - 1).coerceAtLeast(0))) }
    var zoom by remember { mutableStateOf(1f) }
    val density = LocalDensity.current

    BoxWithConstraints(modifier = modifier) {
        val widthPx = with(density) { maxWidth.roundToPx() }.coerceAtLeast(1)

        val bitmapState = produceState<Bitmap?>(initialValue = null, pageIndex, widthPx) {
            value = withContext(Dispatchers.IO) {
                renderer.renderPage(pageIndex.coerceIn(0, renderer.pageCount - 1), widthPx)
            }
        }

        LaunchedEffect(pageIndex) {
            onPageChanged(pageIndex, renderer.pageCount)
        }

        val bitmap = bitmapState.value
        if (bitmap != null) {
            Image(
                bitmap = bitmap.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.FillWidth,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer(scaleX = zoom, scaleY = zoom)
                    .pointerInput(renderer.pageCount) {
                        detectTapGestures(
                            onDoubleTap = { zoom = if (zoom > 1f) 1f else 2.5f },
                            onTap = { offset ->
                                if (offset.x < size.width / 2) {
                                    if (pageIndex > 0) pageIndex -= 1
                                } else {
                                    if (pageIndex < renderer.pageCount - 1) pageIndex += 1
                                }
                            },
                        )
                    },
            )
        }
    }
}

@Composable
private fun EpubReaderContent(
    file: File,
    initialPage: Int,
    onPageChanged: (page: Int, total: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val chaptersState = produceState(initialValue = emptyList<String>(), file) {
        value = withContext(Dispatchers.IO) { EpubParser.extractChapters(file) }
    }
    val chapters = chaptersState.value
    var chapterIndex by remember(chapters.size) {
        mutableStateOf(initialPage.coerceIn(0, (chapters.size - 1).coerceAtLeast(0)))
    }
    var fontScale by remember { mutableStateOf(1f) }

    LaunchedEffect(chapterIndex, chapters.size) {
        if (chapters.isNotEmpty()) onPageChanged(chapterIndex, chapters.size)
    }

    Box(
        modifier = modifier.pointerInput(chapters.size) {
            detectTapGestures(
                onDoubleTap = { fontScale = if (fontScale > 1f) 1f else 1.4f },
                onTap = { offset ->
                    if (offset.x < size.width / 2) {
                        if (chapterIndex > 0) chapterIndex -= 1
                    } else {
                        if (chapterIndex < chapters.size - 1) chapterIndex += 1
                    }
                },
            )
        },
        contentAlignment = Alignment.TopStart,
    ) {
        val text = chapters.getOrNull(chapterIndex) ?: "Carregando livro..."
        Text(
            text = text,
            fontSize = (16 * fontScale).sp,
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        )
    }
}
