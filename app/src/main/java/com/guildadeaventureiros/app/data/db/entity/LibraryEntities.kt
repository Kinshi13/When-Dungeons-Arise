package com.guildadeaventureiros.app.data.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "library_items")
data class LibraryItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val type: String,
    val filePath: String,
    val coverPath: String?,
    val addedAtEpochMilli: Long,
)

@Entity(tableName = "reading_progress")
data class ReadingProgressEntity(
    @PrimaryKey val libraryItemId: Long,
    val lastPage: Int,
    val totalPages: Int,
    val zoomLevel: Float,
    val totalReadingTimeSeconds: Long,
    val lastReadAtEpochMilli: Long,
)

@Entity(tableName = "annotations")
data class AnnotationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val libraryItemId: Long,
    val page: Int,
    val note: String,
    val createdAtEpochMilli: Long,
)
