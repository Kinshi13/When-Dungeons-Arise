package com.guildadeaventureiros.app.ui.reader

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.guildadeaventureiros.app.data.repository.LibraryRepository
import com.guildadeaventureiros.app.domain.model.LibraryItem
import com.guildadeaventureiros.app.domain.model.ReadingProgress
import com.guildadeaventureiros.app.domain.reward.RewardResult
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.Instant

private const val READING_BLOCK_SECONDS = 20 * 60

class ReaderViewModel(
    private val libraryRepository: LibraryRepository,
    private val itemId: Long,
) : ViewModel() {

    private val _item = MutableStateFlow<LibraryItem?>(null)
    val item: StateFlow<LibraryItem?> = _item.asStateFlow()

    val progress: StateFlow<ReadingProgress?> = libraryRepository.observeProgress(itemId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _rewardResult = MutableStateFlow<RewardResult?>(null)
    val rewardResult: StateFlow<RewardResult?> = _rewardResult.asStateFlow()

    private var secondsSinceLastReward = 0
    private var totalReadingTimeSeconds = 0L
    private var lastKnownPage = 0
    private var lastKnownTotalPages = 0
    private var zoomLevel = 1f

    init {
        viewModelScope.launch {
            _item.value = libraryRepository.findItem(itemId)
            val existing = libraryRepository.observeProgress(itemId).first()
            totalReadingTimeSeconds = existing?.totalReadingTimeSeconds ?: 0
            lastKnownPage = existing?.lastPage ?: 0
            lastKnownTotalPages = existing?.totalPages ?: 0
            zoomLevel = existing?.zoomLevel ?: 1f
            startReadingTimer()
        }
    }

    private fun startReadingTimer() {
        viewModelScope.launch {
            while (isActive) {
                delay(1_000)
                totalReadingTimeSeconds += 1
                secondsSinceLastReward += 1
                if (secondsSinceLastReward >= READING_BLOCK_SECONDS) {
                    secondsSinceLastReward -= READING_BLOCK_SECONDS
                    _rewardResult.value = libraryRepository.grantReadingReward(20)
                }
                persistProgress()
            }
        }
    }

    fun updatePage(page: Int, totalPages: Int) {
        lastKnownPage = page
        lastKnownTotalPages = totalPages
        viewModelScope.launch { persistProgress() }
    }

    fun setZoom(zoom: Float) {
        zoomLevel = zoom
        viewModelScope.launch { persistProgress() }
    }

    private suspend fun persistProgress() {
        libraryRepository.saveProgress(
            ReadingProgress(
                libraryItemId = itemId,
                lastPage = lastKnownPage,
                totalPages = lastKnownTotalPages,
                zoomLevel = zoomLevel,
                totalReadingTimeSeconds = totalReadingTimeSeconds,
                lastReadAt = Instant.now(),
            )
        )
    }

    fun dismissReward() {
        _rewardResult.value = null
    }
}

class ReaderViewModelFactory(
    private val libraryRepository: LibraryRepository,
    private val itemId: Long,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return ReaderViewModel(libraryRepository, itemId) as T
    }
}
