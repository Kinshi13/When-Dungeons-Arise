package com.guildadeaventureiros.app.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.guildadeaventureiros.app.data.db.entity.MissionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MissionDao {
    @Query("SELECT * FROM missions ORDER BY createdAtEpochMilli ASC")
    fun observeAll(): Flow<List<MissionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(mission: MissionEntity): Long

    @Update
    suspend fun update(mission: MissionEntity)

    @Query("SELECT * FROM missions WHERE id = :id")
    suspend fun findById(id: Long): MissionEntity?

    @Query("DELETE FROM missions WHERE id = :id")
    suspend fun delete(id: Long)
}
