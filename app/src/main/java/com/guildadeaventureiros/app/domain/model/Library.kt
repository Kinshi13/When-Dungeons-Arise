package com.guildadeaventureiros.app.domain.model

import java.time.Instant

enum class DocumentType { PDF, EPUB }

data class LibraryItem(
    val id: Long = 0,
    val title: String,
    val type: DocumentType,
    val filePath: String,
    val coverPath: String? = null,
    val addedAt: Instant = Instant.now(),
)

data class ReadingProgress(
    val libraryItemId: Long,
    val lastPage: Int = 0,
    val totalPages: Int = 0,
    val zoomLevel: Float = 1f,
    val totalReadingTimeSeconds: Long = 0,
    val lastReadAt: Instant = Instant.now(),
)

data class Annotation(
    val id: Long = 0,
    val libraryItemId: Long,
    val page: Int,
    val note: String,
    val createdAt: Instant = Instant.now(),
)
