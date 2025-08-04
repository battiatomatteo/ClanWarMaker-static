import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabella per i player registrati alle CWL
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }), // Indice auto-incrementale
  nomePlayer: text("nome_player").notNull(), // Nome del player in game
  thPlayer: integer("th_player").notNull(), // Livello Town Hall
  createdAt: text("created_at").default(sql`datetime('now')`), // Data registrazione
});

// Tabella per i contenuti modificabili della home
export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(), // chiave identificativa (es: 'clan_name', 'clan_description')
  value: text("value").notNull(), // valore del contenuto
  updatedAt: text("updated_at").default(sql`datetime('now')`),
});

// Schema per inserimento player (senza id auto-generato)
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

// Schema per inserimento/aggiornamento contenuti
export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  updatedAt: true,
});

// Tabella per i clan CWL
export const clans = sqliteTable("clans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  participants: integer("participants").notNull().default(15),
  league: text("league").notNull(),
  createdAt: text("created_at").default(sql`datetime('now')`),
});

// Tabella per liste CWL
export const cwlLists = sqliteTable("cwl_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").default(sql`datetime('now')`),
});

// Tabella per assegnazioni player a clan
export const playerAssignments = sqliteTable("player_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  clanId: integer("clan_id").notNull().references(() => clans.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  listId: integer("list_id").references(() => cwlLists.id, { onDelete: "cascade" }),
});

// Schema per inserimento clan
export const insertClanSchema = createInsertSchema(clans).omit({
  id: true,
  createdAt: true,
});

// Schema per inserimento lista CWL
export const insertCwlListSchema = createInsertSchema(cwlLists).omit({
  id: true,
  createdAt: true,
});

// Schema per assegnazione player
export const insertPlayerAssignmentSchema = createInsertSchema(playerAssignments).omit({
  id: true,
});

// Interfaccia per Clash Player da API
export interface ClashPlayer {
  name: string;
  tag: string;
  townHallLevel: number;
  warStars: number;
  trophies: number;
  bestTrophies: number;
  legendStatistics?: any;
}

// Interfaccia per clan con player assegnati
export interface ClanWithPlayers {
  id: number;
  name: string;
  participants: number;
  league: string;
  players: (Player & { position: number })[];
}

// Tipi TypeScript
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;
export type InsertClan = z.infer<typeof insertClanSchema>;
export type Clan = typeof clans.$inferSelect;
export type InsertCwlList = z.infer<typeof insertCwlListSchema>;
export type CwlList = typeof cwlLists.$inferSelect;
export type InsertPlayerAssignment = z.infer<typeof insertPlayerAssignmentSchema>;
export type PlayerAssignment = typeof playerAssignments.$inferSelect;
