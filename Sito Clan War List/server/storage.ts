import { 
  type Player, type InsertPlayer, 
  type Content, type InsertContent,
  type Clan, type InsertClan,
  type CwlList, type InsertCwlList,
  type PlayerAssignment, type InsertPlayerAssignment,
  type ClanWithPlayers,
  type ClashPlayer
} from "@shared/schema";
import Database from "better-sqlite3";
import path from "path";

// Interfaccia per le operazioni CRUD
export interface IStorage {
  // Operazioni sui player
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  deletePlayer(id: number): Promise<boolean>;
  clearAllPlayers(): Promise<boolean>;
  
  // Operazioni sui contenuti
  getContent(key: string): Promise<Content | undefined>;
  getAllContent(): Promise<Content[]>;
  upsertContent(content: InsertContent): Promise<Content>;
  
  // Operazioni sui clan
  getClans(): Promise<Clan[]>;
  getClan(id: number): Promise<Clan | undefined>;
  createClan(clan: InsertClan): Promise<Clan>;
  deleteClan(id: number): Promise<boolean>;
  clearAllClans(): Promise<boolean>;
  
  // Operazioni su liste CWL
  getCwlLists(): Promise<CwlList[]>;
  getCwlList(id: number): Promise<CwlList | undefined>;
  createCwlList(list: InsertCwlList): Promise<CwlList>;
  deleteCwlList(id: number): Promise<boolean>;
  
  // Operazioni su assegnazioni player
  assignPlayerToClan(playerId: number, clanId: number, position: number, listId?: number): Promise<PlayerAssignment>;
  removePlayerFromClan(playerId: number, clanId: number): Promise<boolean>;
  getClansWithPlayers(listId?: number): Promise<ClanWithPlayers[]>;
  movePlayerInClan(playerId: number, clanId: number, newPosition: number): Promise<boolean>;
  movePlayerBetweenClans(playerId: number, fromClanId: number, toClanId: number): Promise<boolean>;
  
  // Statistiche
  getPlayerStats(): Promise<{
    totalPlayers: number;
    todayRegistrations: number;
    avgTownHall: number;
  }>;
  
  // Generazione messaggi CWL
  generateCwlMessage(clansWithPlayers: ClanWithPlayers[]): Promise<string>;
}

// Implementazione SQLite
export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    // Crea il database SQLite nel file cwl_manager.db
    const dbPath = path.join(process.cwd(), "cwl_manager.db");
    this.db = new Database(dbPath);
    
    // Abilita foreign keys
    this.db.pragma("foreign_keys = ON");
    
    // Inizializza le tabelle
    this.initTables();
    this.seedDefaultContent();
  }

  private initTables() {
    // Crea tabella players
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_player TEXT NOT NULL,
        th_player INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Crea tabella content
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Crea tabella clans
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        participants INTEGER NOT NULL DEFAULT 15,
        league TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Crea tabella cwl_lists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cwl_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Crea tabella player_assignments
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS player_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        clan_id INTEGER NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        list_id INTEGER,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        FOREIGN KEY (clan_id) REFERENCES clans (id) ON DELETE CASCADE,
        FOREIGN KEY (list_id) REFERENCES cwl_lists (id) ON DELETE CASCADE
      )
    `);
  }

  private seedDefaultContent() {
    // Inserisce contenuti di default se non esistono
    const defaultContents = [
      { key: "clan_name", value: "🏰 Guerrieri del Nord" },
      { key: "clan_description", value: "Clan competitivo italiano specializzato nelle Clan War League. Unisciti a noi per conquistare la gloria!" },
      { key: "clan_rules", value: "Partecipazione obbligatoria alle CWL\nDonazioni minime: 1000 al mese\nRispetto e comunicazione nel chat clan\nTH12+ per partecipare alle CWL" },
      { key: "member_count", value: "47/50 Membri" },
      { key: "clan_trophies", value: "52,340 Trofei" },
      { key: "cwl_league", value: "Crystal I" },
      { key: "cwl_status", value: "Giorno 5/7 - In corso" },
      { key: "cwl_wins", value: "4/6" }
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO content (key, value) VALUES (?, ?)
    `);

    for (const content of defaultContents) {
      stmt.run(content.key, content.value);
    }
  }

  async getPlayers(): Promise<Player[]> {
    const stmt = this.db.prepare("SELECT * FROM players ORDER BY created_at DESC");
    return stmt.all() as Player[];
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const stmt = this.db.prepare("SELECT * FROM players WHERE id = ?");
    return stmt.get(id) as Player | undefined;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const stmt = this.db.prepare(`
      INSERT INTO players (nome_player, th_player) 
      VALUES (?, ?) 
      RETURNING *
    `);
    return stmt.get(player.nomePlayer, player.thPlayer) as Player;
  }

  async deletePlayer(id: number): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM players WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async getContent(key: string): Promise<Content | undefined> {
    const stmt = this.db.prepare("SELECT * FROM content WHERE key = ?");
    return stmt.get(key) as Content | undefined;
  }

  async getAllContent(): Promise<Content[]> {
    const stmt = this.db.prepare("SELECT * FROM content ORDER BY key");
    return stmt.all() as Content[];
  }

  async upsertContent(content: InsertContent): Promise<Content> {
    const stmt = this.db.prepare(`
      INSERT INTO content (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = datetime('now')
      RETURNING *
    `);
    return stmt.get(content.key, content.value) as Content;
  }

  async clearAllPlayers(): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM players");
    const result = stmt.run();
    return result.changes > 0;
  }

  // Operazioni sui clan
  async getClans(): Promise<Clan[]> {
    const stmt = this.db.prepare("SELECT * FROM clans ORDER BY created_at DESC");
    return stmt.all() as Clan[];
  }

  async getClan(id: number): Promise<Clan | undefined> {
    const stmt = this.db.prepare("SELECT * FROM clans WHERE id = ?");
    return stmt.get(id) as Clan | undefined;
  }

  async createClan(clan: InsertClan): Promise<Clan> {
    const stmt = this.db.prepare(`
      INSERT INTO clans (name, participants, league) 
      VALUES (?, ?, ?) 
      RETURNING *
    `);
    return stmt.get(clan.name, clan.participants, clan.league) as Clan;
  }

  async deleteClan(id: number): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM clans WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async clearAllClans(): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM clans");
    const result = stmt.run();
    return result.changes > 0;
  }

  // Operazioni su liste CWL
  async getCwlLists(): Promise<CwlList[]> {
    const stmt = this.db.prepare("SELECT * FROM cwl_lists ORDER BY created_at DESC");
    return stmt.all() as CwlList[];
  }

  async getCwlList(id: number): Promise<CwlList | undefined> {
    const stmt = this.db.prepare("SELECT * FROM cwl_lists WHERE id = ?");
    return stmt.get(id) as CwlList | undefined;
  }

  async createCwlList(list: InsertCwlList): Promise<CwlList> {
    const stmt = this.db.prepare(`
      INSERT INTO cwl_lists (name, message) 
      VALUES (?, ?) 
      RETURNING *
    `);
    return stmt.get(list.name, list.message) as CwlList;
  }

  async deleteCwlList(id: number): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM cwl_lists WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Operazioni su assegnazioni player
  async assignPlayerToClan(playerId: number, clanId: number, position: number, listId?: number): Promise<PlayerAssignment> {
    // Rimuovi assegnazione precedente se esiste
    await this.removePlayerFromClan(playerId, clanId);
    
    const stmt = this.db.prepare(`
      INSERT INTO player_assignments (player_id, clan_id, position, list_id) 
      VALUES (?, ?, ?, ?) 
      RETURNING *
    `);
    return stmt.get(playerId, clanId, position, listId || null) as PlayerAssignment;
  }

  async removePlayerFromClan(playerId: number, clanId: number): Promise<boolean> {
    const stmt = this.db.prepare("DELETE FROM player_assignments WHERE player_id = ? AND clan_id = ?");
    const result = stmt.run(playerId, clanId);
    return result.changes > 0;
  }

  async getClansWithPlayers(listId?: number): Promise<ClanWithPlayers[]> {
    const clans = await this.getClans();
    const result: ClanWithPlayers[] = [];

    for (const clan of clans) {
      const playersStmt = this.db.prepare(`
        SELECT p.*, pa.position 
        FROM players p 
        JOIN player_assignments pa ON p.id = pa.player_id 
        WHERE pa.clan_id = ? ${listId ? 'AND pa.list_id = ?' : ''}
        ORDER BY pa.position ASC
      `);
      
      const players = listId 
        ? playersStmt.all(clan.id, listId) 
        : playersStmt.all(clan.id);

      result.push({
        ...clan,
        players: players as (Player & { position: number })[]
      });
    }

    return result;
  }

  async movePlayerInClan(playerId: number, clanId: number, newPosition: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE player_assignments 
      SET position = ? 
      WHERE player_id = ? AND clan_id = ?
    `);
    const result = stmt.run(newPosition, playerId, clanId);
    return result.changes > 0;
  }

  async movePlayerBetweenClans(playerId: number, fromClanId: number, toClanId: number): Promise<boolean> {
    // Trova la prossima posizione nel clan di destinazione
    const posStmt = this.db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as nextPos 
      FROM player_assignments 
      WHERE clan_id = ?
    `);
    const { nextPos } = posStmt.get(toClanId) as { nextPos: number };

    // Rimuovi dal clan precedente
    await this.removePlayerFromClan(playerId, fromClanId);
    
    // Aggiungi al nuovo clan
    const assignment = await this.assignPlayerToClan(playerId, toClanId, nextPos);
    return !!assignment;
  }

  async generateCwlMessage(clansWithPlayers: ClanWithPlayers[]): Promise<string> {
    let message = "";

    for (const clan of clansWithPlayers) {
      message += `${clan.league}\n\n`;
      message += `${clan.name} - ${clan.participants} partecipanti\n\n`;

      clan.players.forEach((player, index) => {
        message += `${index + 1}) ${player.nomePlayer} - TH${player.thPlayer}\n`;
      });

      const missingPlayers = Math.max(0, clan.participants - clan.players.length);
      if (missingPlayers > 0) {
        message += `\nMancano ancora ${missingPlayers} player\n`;
      }

      message += "\n---\n\n";
    }

    return message;
  }

  async getPlayerStats(): Promise<{
    totalPlayers: number;
    todayRegistrations: number;
    avgTownHall: number;
  }> {
    // Conta totale player
    const totalStmt = this.db.prepare("SELECT COUNT(*) as count FROM players");
    const totalResult = totalStmt.get() as { count: number };

    // Conta registrazioni di oggi
    const todayStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM players 
      WHERE date(created_at) = date('now')
    `);
    const todayResult = todayStmt.get() as { count: number };

    // Media Town Hall
    const avgStmt = this.db.prepare("SELECT AVG(th_player) as avg FROM players");
    const avgResult = avgStmt.get() as { avg: number | null };

    return {
      totalPlayers: totalResult.count,
      todayRegistrations: todayResult.count,
      avgTownHall: Math.round((avgResult.avg || 0) * 10) / 10
    };
  }
}

export const storage = new SQLiteStorage();
