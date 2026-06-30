package com.guildadeaventureiros.app.ui.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.guildadeaventureiros.app.ui.library.LibraryScreen
import com.guildadeaventureiros.app.ui.reader.ReaderScreen
import com.guildadeaventureiros.app.ui.reception.GuildReceptionScreen
import com.guildadeaventureiros.app.ui.reception.MissionBoardScreen
import com.guildadeaventureiros.app.ui.treasury.CalculatorScreen
import com.guildadeaventureiros.app.ui.treasury.TreasuryScreen

private const val ROUTE_AREAS = "areas"
private const val ROUTE_MISSION_BOARD = "missionBoard"
private const val ROUTE_CALCULATOR = "calculator"
private const val ROUTE_READER = "reader/{itemId}"

/** Grafo de navegação raiz: 3 áreas principais navegáveis por swipe + telas de detalhe empilhadas. */
@Composable
fun GuildaNavHost(modifier: Modifier = Modifier) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = ROUTE_AREAS, modifier = modifier) {
        composable(ROUTE_AREAS) {
            GuildaAreasPager(
                onOpenMissionBoard = { navController.navigate(ROUTE_MISSION_BOARD) },
                onOpenCalculator = { navController.navigate(ROUTE_CALCULATOR) },
                onOpenReader = { itemId -> navController.navigate("reader/$itemId") },
            )
        }
        composable(ROUTE_MISSION_BOARD) {
            MissionBoardScreen(onBack = { navController.popBackStack() })
        }
        composable(ROUTE_CALCULATOR) {
            CalculatorScreen(onBack = { navController.popBackStack() })
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
    onOpenReader: (Long) -> Unit,
) {
    val pagerState = rememberPagerState(initialPage = 0) { 3 }
    HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
        when (page) {
            0 -> GuildReceptionScreen(onOpenMissionBoard = onOpenMissionBoard)
            1 -> TreasuryScreen(onOpenCalculator = onOpenCalculator)
            else -> LibraryScreen(onOpenReader = onOpenReader)
        }
    }
}
