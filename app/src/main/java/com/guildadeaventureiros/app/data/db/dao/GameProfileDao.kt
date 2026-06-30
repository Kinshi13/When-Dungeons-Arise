package com.guildadeaventureiros.app.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.guildadeaventureiros.app.data.db.entity.GameProfileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface GameProfileDao {
    @Query("SELECT * FROM game_profile WHERE id = 0")
    fun observe(): Flow<GameProfileEntity?>

    @Query("SELECT * FROM game_profile WHERE id = 0")
    suspend fun get(): GameProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(profile: GameProfileEntity)
}
