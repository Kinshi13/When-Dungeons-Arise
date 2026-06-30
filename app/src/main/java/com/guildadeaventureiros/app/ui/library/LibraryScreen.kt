package com.guildadeaventureiros.app.ui.library

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.R
import com.guildadeaventureiros.app.domain.model.LibraryItem
import com.guildadeaventureiros.app.ui.components.GameTopBar
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.components.SceneBackground
import com.guildadeaventureiros.app.ui.rememberAppContainer
import com.guildadeaventureiros.app.ui.theme.GuildColors

/** Biblioteca — importar e abrir PDFs/EPUBs, com progresso de leitura salvo por item. */
@Composable
fun LibraryScreen(
    onOpenReader: (Long) -> Unit,
    modifier: Modifier = Modifier,
) {
    val container = rememberAppContainer()
    val context = LocalContext.current
    val viewModel: LibraryViewModel = viewModel(
        factory = LibraryViewModelFactory(container.libraryRepository, container.gameProfileRepository),
    )
    val profile by viewModel.profile.collectAsState()
    val libraryItems by viewModel.items.collectAsState()

    val pickDocument = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            importDocumentFromUri(context, uri)?.let { imported ->
                viewModel.importItem(imported.title, imported.type, imported.filePath)
            }
        }
    }

    SceneBackground(backgroundRes = R.drawable.bg_library, modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            GameTopBar(profile = profile)
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Text(text = "Biblioteca")
                PixelButton(
                    text = "Importar PDF ou EPUB",
                    onClick = { pickDocument.launch(arrayOf("application/pdf", "application/epub+zip")) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                )

                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(libraryItems, key = { it.id }) { item ->
                        LibraryItemRow(item = item, onClick = { onOpenReader(item.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun LibraryItemRow(item: LibraryItem, onClick: () -> Unit) {
    Box(modifier = Modifier.fillMaxWidth()) {
        Surface(
            onClick = onClick,
            color = GuildColors.Parchment,
            contentColor = GuildColors.TextOnParchment,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = item.title)
                Text(text = item.type.name)
            }
        }
    }
}
