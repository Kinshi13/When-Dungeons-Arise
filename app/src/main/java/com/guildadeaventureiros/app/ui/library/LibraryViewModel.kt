package com.guildadeaventureiros.app.ui.library

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.guildadeaventureiros.app.data.repository.GameProfileRepository
import com.guildadeaventureiros.app.data.repository.LibraryRepository
import com.guildadeaventureiros.app.domain.model.DocumentType
import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.domain.model.LibraryItem
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class LibraryViewModel(
    private val libraryRepository: LibraryRepository,
    gameProfileRepository: GameProfileRepository,
) : ViewModel() {

    val profile: StateFlow<GameProfile> = gameProfileRepository.observeProfile()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), GameProfile())

    val items: StateFlow<List<LibraryItem>> = libraryRepository.observeItems()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun importItem(title: String, type: DocumentType, filePath: String) {
        viewModelScope.launch { libraryRepository.importItem(title, type, filePath) }
    }
}

class LibraryViewModelFactory(
    private val libraryRepository: LibraryRepository,
    private val gameProfileRepository: GameProfileRepository,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return LibraryViewModel(libraryRepository, gameProfileRepository) as T
    }
}
