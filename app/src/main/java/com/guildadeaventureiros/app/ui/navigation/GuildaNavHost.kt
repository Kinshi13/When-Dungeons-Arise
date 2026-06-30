package com.guildadeaventureiros.app.ui.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.guildadeaventureiros.app.ui.components.CharacterPortraitBar
import com.guildadeaventureiros.app.ui.library.LibraryScreen
import com.guildadeaventureiros.app.ui.reader.ReaderScreen
import com.guildadeaventureiros.app.ui.reception.GuildReceptionScreen
import com.guildadeaventureiros.app.ui.reception.MissionBoardScreen
import com.guildadeaventureiros.app.ui.settings.SettingsScreen
import com.guildadeaventureiros.app.ui.treasury.CalculatorScreen
import com.guildadeaventureiros.app.ui.treasury.TreasuryScreen
import kotlinx.coroutines.launch

private const val ROUTE_AREAS = "areas"
private const val ROUTE_MISSION_BOARD = "missionBoard"
private const val ROUTE_CALCULATOR = "calculator"
private const val ROUTE_SETTINGS = "settings"
private const val ROUTE_READER = "reader/{itemId}"
private const val TRANSITION_MS = 280

/** Grafo de navegação raiz: 3 áreas principais navegáveis por swipe + telas de detalhe empilhadas com transição suave. */
@Composable
fun GuildaNavHost(modifier: Modifier = Modifier) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = ROUTE_AREAS,
        modifier = modifier,
        enterTransition = {
            slideInVertically(animationSpec = tween(TRANSITION_MS)) { it / 6 } + fadeIn(tween(TRANSITION_MS))
        },
        exitTransition = {
            fadeOut(tween(TRANSITION_MS))
        },
        popEnterTransition = {
            fadeIn(tween(TRANSITION_MS))
        },
        popExitTransition = {
            slideOutVertically(animationSpec = tween(TRANSITION_MS)) { it / 6 } + fadeOut(tween(TRANSITION_MS))
        },
    ) {
        composable(ROUTE_AREAS) {
            GuildaAreasPager(
                onOpenMissionBoard = { navController.navigate(ROUTE_MISSION_BOARD) },
                onOpenCalculator = { navController.navigate(ROUTE_CALCULATOR) },
                onOpenSettings = { navController.navigate(ROUTE_SETTINGS) },
                onOpenReader = { itemId -> navController.navigate("reader/$itemId") },
            )
        }
        composable(ROUTE_MISSION_BOARD) {
            MissionBoardScreen(onBack = { navController.popBackStack() })
        }
        composable(ROUTE_CALCULATOR) {
            CalculatorScreen(onBack = { navController.popBackStack() })
        }
        composable(ROUTE_SETTINGS) {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
        composable(
            route = ROUTE_READER,
            arguments = listOf(navArgument("itemId") { type = NavType.LongType }),
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getLong("itemId") ?: 0L
            ReaderScreen(itemId = itemId, onBack = { navController.popBackStack() })
        }
    }
}

@Composable
private fun GuildaAreasPager(
    onOpenMissionBoard: () -> Unit,
    onOpenCalculator: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenReader: (Long) -> Unit,
) {
    val pagerState = rememberPagerState(initialPage = 0) { 3 }
    val coroutineScope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.weight(1f)) {
            HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
                when (page) {
                    0 -> GuildReceptionScreen(
                        onOpenMissionBoard = onOpenMissionBoard,
                        onOpenSettings = onOpenSettings,
                    )
                    1 -> TreasuryScreen(onOpenCalculator = onOpenCalculator)
                    else -> LibraryScreen(onOpenReader = onOpenReader)
                }
            }
        }
        CharacterPortraitBar(
            currentPage = pagerState.currentPage,
            onSelectPage = { page ->
                coroutineScope.launch { pagerState.animateScrollToPage(page) }
            },
        )
    }
}
