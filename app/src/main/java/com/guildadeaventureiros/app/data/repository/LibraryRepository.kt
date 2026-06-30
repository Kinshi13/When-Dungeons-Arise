package com.guildadeaventureiros.app.data.repository

import com.guildadeaventureiros.app.data.db.dao.LibraryDao
import com.guildadeaventureiros.app.data.db.entity.AnnotationEntity
import com.guildadeaventureiros.app.data.db.entity.LibraryItemEntity
import com.guildadeaventureiros.app.data.db.entity.ReadingProgressEntity
import com.guildadeaventureiros.app.domain.model.Annotation
import com.guildadeaventureiros.app.domain.model.DocumentType
import com.guildadeaventureiros.app.domain.model.LibraryItem
import com.guildadeaventureiros.app.domain.model.ReadingProgress
import com.guildadeaventureiros.app.domain.reward.RewardEvent
import com.guildadeaventureiros.app.domain.reward.RewardResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant

class LibraryRepository(
    private val libraryDao: LibraryDao,
    private val gameProfileRepository: GameProfileRepository,
) {
    fun observeItems(): Flow<List<LibraryItem>> = libraryDao.observeItems().map { list -> list.map { it.toDomain() } }

    suspend fun findItem(id: Long): LibraryItem? = libraryDao.findItemById(id)?.toDomain()

    suspend fun importItem(title: String, type: DocumentType, filePath: String, coverPath: String? = null): Long =
        libraryDao.insertItem(
            LibraryItemEntity(
                title = title,
                type = type.name,
                filePath = filePath,
                coverPath = coverPath,
                addedAtEpochMilli = Instant.now().toEpochMilli(),
            )
        )

    fun observeProgress(itemId: Long): Flow<ReadingProgress?> = libraryDao.observeProgress(itemId).map { it?.toDomain() }

    suspend fun saveProgress(progress: ReadingProgress) = libraryDao.upsertProgress(progress.toEntity())

    fun observeAnnotations(itemId: Long): Flow<List<Annotation>> =
        libraryDao.observeAnnotations(itemId).map { list -> list.map { it.toDomain() } }

    suspend fun addAnnotation(itemId: Long, page: Int, note: String) =
        libraryDao.insertAnnotation(
            AnnotationEntity(libraryItemId = itemId, page = page, note = note, createdAtEpochMilli = Instant.now().toEpochMilli())
        )

    /** Chamar quando o usuário acumular blocos de 20 minutos de leitura contínua numa sessão. */
    suspend fun grantReadingReward(minutes: Int): RewardResult =
        gameProfileRepository.grantReward(RewardEvent.ReadingSession(minutes))
}

private fun LibraryItemEntity.toDomain() = LibraryItem(
    id = id, title = title, type = DocumentType.valueOf(type), filePath = filePath,
    coverPath = coverPath, addedAt = Instant.ofEpochMilli(addedAtEpochMilli),
)

private fun ReadingProgressEntity.toDomain() = ReadingProgress(
    libraryItemId = libraryItemId, lastPage = lastPage, totalPages = totalPages, zoomLevel = zoomLevel,
    totalReadingTimeSeconds = totalReadingTimeSeconds, lastReadAt = Instant.ofEpochMilli(lastReadAtEpochMilli),
)

private fun ReadingProgress.toEntity() = ReadingProgressEntity(
    libraryItemId = libraryItemId, lastPage = lastPage, totalPages = totalPages, zoomLevel = zoomLevel,
    totalReadingTimeSeconds = totalReadingTimeSeconds, lastReadAtEpochMilli = lastReadAt.toEpochMilli(),
)

private fun AnnotationEntity.toDomain() = Annotation(
    id = id, libraryItemId = libraryItemId, page = page, note = note, createdAt = Instant.ofEpochMilli(createdAtEpochMilli),
)
