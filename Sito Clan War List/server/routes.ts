import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, 
  insertContentSchema, 
  insertClanSchema,
  insertCwlListSchema,
  type ClashPlayer 
} from "@shared/schema";
import { z } from "zod";
import PDFDocument from "pdfkit";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // API per ottenere tutti i player registrati
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      console.error("Errore nel recupero player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per registrare un nuovo player
  app.post("/api/players", async (req, res) => {
    try {
      // Valida i dati con Zod
      const validatedData = insertPlayerSchema.parse(req.body);
      
      // Verifica che il TH sia almeno 12
      if (validatedData.thPlayer < 12) {
        return res.status(400).json({ 
          message: "Town Hall minimo richiesto: 12" 
        });
      }

      // Crea il player nel database
      const newPlayer = await storage.createPlayer(validatedData);
      res.status(201).json(newPlayer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dati non validi", 
          errors: error.errors 
        });
      }
      console.error("Errore nella registrazione player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per eliminare un player (solo admin)
  app.delete("/api/players/:id", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "ID player non valido" });
      }

      const success = await storage.deletePlayer(playerId);
      if (!success) {
        return res.status(404).json({ message: "Player non trovato" });
      }

      res.json({ message: "Player eliminato con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per ottenere tutti i contenuti
  app.get("/api/content", async (req, res) => {
    try {
      const contents = await storage.getAllContent();
      res.json(contents);
    } catch (error) {
      console.error("Errore nel recupero contenuti:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per aggiornare un contenuto
  app.put("/api/content", async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const updatedContent = await storage.upsertContent(validatedData);
      res.json(updatedContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dati non validi", 
          errors: error.errors 
        });
      }
      console.error("Errore nell'aggiornamento contenuto:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per ottenere statistiche
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getPlayerStats();
      res.json(stats);
    } catch (error) {
      console.error("Errore nel recupero statistiche:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per cancellare tutti i player (admin)
  app.delete("/api/players", async (req, res) => {
    try {
      const success = await storage.clearAllPlayers();
      res.json({ message: "Tutti i player sono stati rimossi", success });
    } catch (error) {
      console.error("Errore nella cancellazione di tutti i player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per i clan
  app.get("/api/clans", async (req, res) => {
    try {
      const clans = await storage.getClans();
      res.json(clans);
    } catch (error) {
      console.error("Errore nel recupero clan:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  app.post("/api/clans", async (req, res) => {
    try {
      const validatedData = insertClanSchema.parse(req.body);
      const newClan = await storage.createClan(validatedData);
      res.status(201).json(newClan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dati clan non validi", 
          errors: error.errors 
        });
      }
      console.error("Errore nella creazione clan:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  app.delete("/api/clans/:id", async (req, res) => {
    try {
      const clanId = parseInt(req.params.id);
      if (isNaN(clanId)) {
        return res.status(400).json({ message: "ID clan non valido" });
      }

      const success = await storage.deleteClan(clanId);
      if (!success) {
        return res.status(404).json({ message: "Clan non trovato" });
      }

      res.json({ message: "Clan eliminato con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione clan:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  app.delete("/api/clans", async (req, res) => {
    try {
      const success = await storage.clearAllClans();
      res.json({ message: "Tutti i clan sono stati rimossi", success });
    } catch (error) {
      console.error("Errore nella cancellazione di tutti i clan:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per liste CWL
  app.get("/api/cwl-lists", async (req, res) => {
    try {
      const lists = await storage.getCwlLists();
      res.json(lists);
    } catch (error) {
      console.error("Errore nel recupero liste CWL:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  app.post("/api/cwl-lists", async (req, res) => {
    try {
      const validatedData = insertCwlListSchema.parse(req.body);
      const newList = await storage.createCwlList(validatedData);
      res.status(201).json(newList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dati lista non validi", 
          errors: error.errors 
        });
      }
      console.error("Errore nella creazione lista CWL:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per gestione assegnazioni player
  app.get("/api/clans-with-players", async (req, res) => {
    try {
      const listId = req.query.listId ? parseInt(req.query.listId as string) : undefined;
      const clansWithPlayers = await storage.getClansWithPlayers(listId);
      res.json(clansWithPlayers);
    } catch (error) {
      console.error("Errore nel recupero clan con player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  app.post("/api/assign-player", async (req, res) => {
    try {
      const { playerId, clanId, position, listId } = req.body;
      const assignment = await storage.assignPlayerToClan(playerId, clanId, position, listId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Errore nell'assegnazione player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  app.post("/api/move-player", async (req, res) => {
    try {
      const { playerId, fromClanId, toClanId } = req.body;
      const success = await storage.movePlayerBetweenClans(playerId, fromClanId, toClanId);
      res.json({ success });
    } catch (error) {
      console.error("Errore nello spostamento player:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per generazione messaggio CWL
  app.post("/api/generate-cwl-message", async (req, res) => {
    try {
      const { clansWithPlayers } = req.body;
      const message = await storage.generateCwlMessage(clansWithPlayers);
      res.json({ message });
    } catch (error) {
      console.error("Errore nella generazione messaggio CWL:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per esportazione PDF
  app.post("/api/export-pdf", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Messaggio mancante" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="cwl-message.pdf"');

      const doc = new PDFDocument();
      doc.pipe(res);

      // Aggiungi contenuto al PDF
      doc.fontSize(16).text('Messaggio CWL', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(message);
      doc.end();
    } catch (error) {
      console.error("Errore nell'esportazione PDF:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per esportare lista player (CSV)
  app.get("/api/export/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      
      // Genera CSV
      const csvHeader = "ID,Nome Player,Town Hall,Data Registrazione\n";
      const csvRows = players.map(player => 
        `${player.id},"${player.nomePlayer}",${player.thPlayer},"${player.createdAt}"`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="players_cwl.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Errore nell'esportazione:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // API per Clash of Clans (cerca player)
  app.get("/api/clash-players/:clanTag", async (req, res) => {
    try {
      const { clanTag } = req.params;
      
      if (!clanTag || clanTag.trim() === "") {
        return res.status(400).json({
          message: "Tag clan mancante",
          details: "Devi specificare un tag clan nell'URL"
        });
      }

      const apiKey = process.env.CLASH_API_KEY || process.env.COC_API_KEY || "";
      
      if (!apiKey) {
        return res.status(500).json({
          message: "API Key di Clash of Clans non configurata",
          details: "Configura CLASH_API_KEY nelle variabili d'ambiente"
        });
      }

      // Pulisci il tag clan
      const cleanTag = clanTag.replace(/^#/, '').toUpperCase();
      const apiUrl = `https://api.clashofclans.com/v1/clans/%23${cleanTag}/members`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({
            message: "Clan non trovato",
            details: `Il tag clan "${clanTag}" non esiste o non è valido`
          });
        }
        if (response.status === 403) {
          return res.status(403).json({
            message: "API Key non valida o non autorizzata",
            details: "Verifica che la tua API Key sia corretta e autorizzata per questo IP"
          });
        }
        const errorText = await response.text();
        return res.status(response.status).json({
          message: "Errore nel recupero dei dati da Clash of Clans API",
          details: errorText
        });
      }

      const data = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        return res.status(500).json({
          message: "Formato dati API non valido",
          details: "La risposta dell'API non contiene la lista dei membri"
        });
      }

      const players: ClashPlayer[] = data.items.map((member: any) => ({
        name: member.name,
        tag: member.tag,
        townHallLevel: member.townHallLevel,
        warStars: member.warStars || 0,
        trophies: member.trophies,
        bestTrophies: member.bestTrophies,
        legendStatistics: member.legendStatistics
      }));

      res.json(players);
    } catch (error) {
      console.error('Clash API Error:', error);
      res.status(500).json({
        message: "Errore nel recupero dei dati da Clash of Clans API",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
