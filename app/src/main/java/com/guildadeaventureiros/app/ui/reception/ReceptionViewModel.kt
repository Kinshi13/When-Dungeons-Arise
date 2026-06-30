package com.guildadeaventureiros.app.ui.reception

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.guildadeaventureiros.app.data.repository.GameProfileRepository
import com.guildadeaventureiros.app.data.repository.MissionRepository
import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.domain.model.Mission
import com.guildadeaventureiros.app.domain.model.MissionDifficulty
import com.guildadeaventureiros.app.domain.reward.RewardResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

class ReceptionViewModel(
    private val missionRepository: MissionRepository,
    private val gameProfileRepository: GameProfileRepository,
) : ViewModel() {

    val profile: StateFlow<GameProfile> = gameProfileRepository.observeProfile()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), GameProfile())

    val missions: StateFlow<List<Mission>> = missionRepository.observeMissions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _rewardResult = MutableStateFlow<RewardResult?>(null)
    val rewardResult: StateFlow<RewardResult?> = _rewardResult.asStateFlow()

    fun createMission(title: String, description: String?, difficulty: MissionDifficulty, dueDate: LocalDate?) {
        viewModelScope.launch { missionRepository.createMission(title, description, difficulty, dueDate) }
    }

    fun acceptMission(missionId: Long) {
        viewModelScope.launch { missionRepository.accept(missionId) }
    }

    fun completeMission(missionId: Long) {
        viewModelScope.launch { _rewardResult.value = missionRepository.complete(missionId) }
    }

    fun dismissReward() {
        _rewardResult.value = null
    }
}

class ReceptionViewModelFactory(
    private val missionRepository: MissionRepository,
    private val gameProfileRepository: GameProfileRepository,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return ReceptionViewModel(missionRepository, gameProfileRepository) as T
    }
}
