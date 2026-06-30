package com.guildadeaventureiros.app.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.guildadeaventureiros.app.data.db.entity.AnnotationEntity
import com.guildadeaventureiros.app.data.db.entity.LibraryItemEntity
import com.guildadeaventureiros.app.data.db.entity.ReadingProgressEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LibraryDao {
    @Query("SELECT * FROM library_items ORDER BY addedAtEpochMilli DESC")
    fun observeItems(): Flow<List<LibraryItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: LibraryItemEntity): Long

    @Query("SELECT * FROM library_items WHERE id = :id")
    suspend fun findItemById(id: Long): LibraryItemEntity?

    @Query("SELECT * FROM reading_progress WHERE libraryItemId = :itemId")
    fun observeProgress(itemId: Long): Flow<ReadingProgressEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProgress(progress: ReadingProgressEntity)

    @Query("SELECT * FROM annotations WHERE libraryItemId = :itemId ORDER BY page ASC")
    fun observeAnnotations(itemId: Long): Flow<List<AnnotationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnnotation(annotation: AnnotationEntity): Long
}
