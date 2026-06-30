import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { REWARDS, type RewardKey, type Reward, todayKey, isConsecutiveDay, streakBonusCoins } from "./rewardService";
import { levelForXp } from "./levels";

interface GameState {
  xp: number;
  coins: number;
  streak: number;
  lastActiveDate: string | null;
  todayDate: string;
  todayCompletedCount: number;
  comboBonusAwardedToday: boolean;
}

const STORAGE_KEY = "lembretes-app:game-state";

const DEFAULT_STATE: GameState = {
  xp: 0,
  coins: 0,
  streak: 0,
  lastActiveDate: null,
  todayDate: todayKey(),
  todayCompletedCount: 0,
  comboBonusAwardedToday: false,
};

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    // Se mudou o dia desde a última vez, zera o contador de combo diário.
    if (parsed.todayDate !== todayKey()) {
      parsed.todayDate = todayKey();
      parsed.todayCompletedCount = 0;
      parsed.comboBonusAwardedToday = false;
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

export interface RewardPopupData {
  xp: number;
  coins: number;
  comboBonus: boolean;
  streakBonus: number;
  leveledUp: boolean;
}

interface GameContextValue {
  xp: number;
  coins: number;
  streak: number;
  level: number;
  todayCompletedCount: number;
  grantReward: (key: RewardKey) => RewardPopupData;
  grantCustomReward: (reward: Reward, isTaskCompletion?: boolean) => RewardPopupData;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function applyReward(reward: Reward, isTaskCompletion: boolean): RewardPopupData {
    const levelBefore = levelForXp(state.xp);
    let result: RewardPopupData = { xp: reward.xp, coins: reward.coins, comboBonus: false, streakBonus: 0, leveledUp: false };

    setState((s) => {
      const today = todayKey();
      let { streak, lastActiveDate, todayDate, todayCompletedCount, comboBonusAwardedToday } = s;

      if (todayDate !== today) {
        todayDate = today;
        todayCompletedCount = 0;
        comboBonusAwardedToday = false;
      }

      let extraCoins = 0;
      let comboBonus = false;

      if (isTaskCompletion) {
        todayCompletedCount += 1;
        if (todayCompletedCount === 3 && !comboBonusAwardedToday) {
          comboBonus = true;
          comboBonusAwardedToday = true;
        }

        if (lastActiveDate !== today) {
          if (isConsecutiveDay(lastActiveDate, today)) {
            streak += 1;
          } else if (lastActiveDate !== null) {
            streak = 1;
          } else {
            streak = 1;
          }
          extraCoins = streakBonusCoins(streak);
          lastActiveDate = today;
        }
      }

      const totalXp = reward.xp + (comboBonus ? REWARDS.comboTresTarefas.xp : 0);
      const totalCoins = reward.coins + extraCoins;

      result = {
        xp: totalXp,
        coins: totalCoins,
        comboBonus,
        streakBonus: extraCoins,
        leveledUp: levelForXp(s.xp + totalXp) > levelBefore,
      };

      return {
        ...s,
        xp: s.xp + totalXp,
        coins: s.coins + totalCoins,
        streak,
        lastActiveDate,
        todayDate,
        todayCompletedCount,
        comboBonusAwardedToday,
      };
    });

    return result;
  }

  function grantReward(key: RewardKey): RewardPopupData {
    const isTask = key === "taskSimples" || key === "taskMedia" || key === "taskImportante";
    return applyReward(REWARDS[key], isTask);
  }

  function grantCustomReward(reward: Reward, isTaskCompletion = false): RewardPopupData {
    return applyReward(reward, isTaskCompletion);
  }

  const value: GameContextValue = {
    xp: state.xp,
    coins: state.coins,
    streak: state.streak,
    level: levelForXp(state.xp),
    todayCompletedCount: state.todayCompletedCount,
    grantReward,
    grantCustomReward,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame deve ser usado dentro de GameProvider");
  return ctx;
}
