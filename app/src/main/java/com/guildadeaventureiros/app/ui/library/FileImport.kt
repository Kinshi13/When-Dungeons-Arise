package com.guildadeaventureiros.app.ui.library

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.guildadeaventureiros.app.domain.model.DocumentType
import java.io.File
import java.util.UUID

data class ImportedFile(val title: String, val type: DocumentType, val filePath: String)

/** Copia o documento escolhido (PDF/EPUB) via SAF para o armazenamento interno do app. */
fun importDocumentFromUri(context: Context, uri: Uri): ImportedFile? {
    val displayName = queryDisplayName(context, uri) ?: uri.lastPathSegment ?: "documento"
    val type = when {
        displayName.endsWith(".pdf", ignoreCase = true) -> DocumentType.PDF
        displayName.endsWith(".epub", ignoreCase = true) -> DocumentType.EPUB
        else -> context.contentResolver.getType(uri)?.let { mime ->
            when {
                mime.contains("pdf") -> DocumentType.PDF
                mime.contains("epub") -> DocumentType.EPUB
                else -> null
            }
        } ?: return null
    }

    val extension = if (type == DocumentType.PDF) "pdf" else "epub"
    val libraryDir = File(context.filesDir, "library").apply { mkdirs() }
    val destination = File(libraryDir, "${UUID.randomUUID()}.$extension")

    context.contentResolver.openInputStream(uri)?.use { input ->
        destination.outputStream().use { output -> input.copyTo(output) }
    } ?: return null

    val title = displayName.substringBeforeLast(".")
    return ImportedFile(title = title, type = type, filePath = destination.absolutePath)
}

private fun queryDisplayName(context: Context, uri: Uri): String? {
    val cursor = context.contentResolver.query(uri, null, null, null, null) ?: return null
    cursor.use {
        val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (nameIndex >= 0 && it.moveToFirst()) {
            return it.getString(nameIndex)
        }
    }
    return null
}
