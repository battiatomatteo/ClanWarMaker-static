import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Player, 
  Content, 
  Clan, 
  insertClanSchema,
  ClanWithPlayers,
  ClashPlayer 
} from "@shared/schema";
import { 
  Shield, 
  Download, 
  Users, 
  Edit, 
  Database, 
  Trash2, 
  Search, 
  Save, 
  FileText,
  PlusCircle,
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Crown
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClanTag, setSelectedClanTag] = useState("");
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [clansWithPlayers, setClansWithPlayers] = useState<ClanWithPlayers[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per ottenere i player
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Query per ottenere i contenuti
  const { data: contents = [] } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });

  // Query per i clan
  const { data: clans = [] } = useQuery<Clan[]>({
    queryKey: ["/api/clans"],
  });

  // Query per clan con player assegnati
  const { data: clansWithPlayersData = [] } = useQuery<ClanWithPlayers[]>({
    queryKey: ["/api/clans-with-players"],
    enabled: showPlayerManager,
  });

  // Query per Clash of Clans player
  const { 
    data: clashPlayers = [], 
    isLoading: isLoadingClashPlayers, 
    error: clashError,
    refetch: refetchClashPlayers
  } = useQuery<ClashPlayer[]>({
    queryKey: ["/api/clash-players", selectedClanTag],
    enabled: !!selectedClanTag,
    retry: false,
  });

  // Query per le statistiche
  const { data: stats } = useQuery<{
    totalPlayers: number;
    todayRegistrations: number;
    avgTownHall: number;
  }>({
    queryKey: ["/api/stats"],
  });

  // Form per modificare i contenuti
  const contentForm = useForm({
    defaultValues: {
      clan_name: "",
      clan_description: "",
      clan_rules: "",
    },
  });

  // Form per aggiungere clan
  const clanForm = useForm<{
    name: string;
    participants: number;
    league: string;
  }>({
    resolver: zodResolver(insertClanSchema),
    defaultValues: {
      name: "",
      participants: 15,
      league: "",
    },
  });

  // Popola il form quando arrivano i contenuti
  React.useEffect(() => {
    if (contents.length > 0) {
      const contentMap = contents.reduce((acc, content) => {
        acc[content.key] = content.value;
        return acc;
      }, {} as Record<string, string>);

      contentForm.reset({
        clan_name: contentMap.clan_name || "",
        clan_description: contentMap.clan_description || "",
        clan_rules: contentMap.clan_rules || "",
      });
    }
  }, [contents, contentForm]);

  // Aggiorna clansWithPlayers quando arrivano i dati
  React.useEffect(() => {
    if (clansWithPlayersData.length > 0) {
      setClansWithPlayers(clansWithPlayersData);
    }
  }, [clansWithPlayersData]);

  // Mutation per eliminare un player
  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      return apiRequest("DELETE", `/api/players/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Player eliminato",
        description: "Il player è stato rimosso con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nell'eliminazione del player.",
      });
    },
  });

  // Mutation per aggiornare i contenuti
  const updateContentMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return apiRequest("PUT", "/api/content", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Contenuto aggiornato",
        description: "Il contenuto è stato salvato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nell'aggiornamento del contenuto.",
      });
    },
  });

  // Mutation per creare clan
  const createClanMutation = useMutation({
    mutationFn: async (data: { name: string; participants: number; league: string }) => {
      return apiRequest("POST", "/api/clans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clans"] });
      clanForm.reset();
      toast({
        title: "Clan creato",
        description: "Il clan è stato aggiunto con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nella creazione del clan.",
      });
    },
  });

  // Mutation per cancellare tutti i player
  const clearPlayersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/players");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Player cancellati",
        description: "Tutti i player sono stati rimossi con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nella cancellazione dei player.",
      });
    },
  });

  // Mutation per cancellare tutti i clan
  const clearClansMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/clans");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clans"] });
      toast({
        title: "Clan cancellati",
        description: "Tutti i clan sono stati rimossi con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nella cancellazione dei clan.",
      });
    },
  });

  // Mutation per generare messaggio CWL
  const generateMessageMutation = useMutation({
    mutationFn: async (clansWithPlayers: ClanWithPlayers[]) => {
      return apiRequest("POST", "/api/generate-cwl-message", { clansWithPlayers });
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      toast({
        title: "Messaggio generato",
        description: "Il messaggio CWL è stato generato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nella generazione del messaggio.",
      });
    },
  });

  // Mutation per esportare PDF
  const exportPdfMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "cwl-message.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "PDF esportato",
        description: "Il PDF è stato scaricato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nell'esportazione del PDF.",
      });
    },
  });

  // Mutation per spostare player tra clan
  const movePlayerMutation = useMutation({
    mutationFn: async ({ playerId, fromClanId, toClanId }: { playerId: number; fromClanId: number; toClanId: number }) => {
      return apiRequest("POST", "/api/move-player", { playerId, fromClanId, toClanId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clans-with-players"] });
      toast({
        title: "Player spostato",
        description: "Il player è stato spostato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nello spostamento del player.",
      });
    },
  });

  // Funzione per esportare i player
  const handleExport = () => {
    window.open("/api/export/players", "_blank");
  };

  // Funzione per eliminare un player
  const handleDeletePlayer = (playerId: number, playerName: string) => {
    if (confirm(`Sei sicuro di voler eliminare il player "${playerName}"?`)) {
      deletePlayerMutation.mutate(playerId);
    }
  };

  // Funzione per aggiungere clan
  const onSubmitClan = (data: { name: string; participants: number; league: string }) => {
    createClanMutation.mutate(data);
  };

  // Funzione per aggiornare i contenuti
  const onSubmitContent = (data: any) => {
    // Aggiorna ogni campo modificato
    Object.entries(data).forEach(([key, value]) => {
      updateContentMutation.mutate({ key, value: value as string });
    });
  };

  // Funzione per assegnare player ai clan
  const assignPlayersToClans = () => {
    if (clans.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un clan prima di assegnare i player",
        variant: "destructive",
      });
      return;
    }

    // Distribuzione automatica player tra clan
    const newClansWithPlayers: ClanWithPlayers[] = clans.map((clan) => ({
      ...clan,
      players: []
    }));

    // Distribuisci i player registrati tra i clan
    players.forEach((player, index) => {
      const clanIndex = index % clans.length;
      newClansWithPlayers[clanIndex].players.push({
        ...player,
        position: newClansWithPlayers[clanIndex].players.length
      });
    });

    setClansWithPlayers(newClansWithPlayers);
    setShowPlayerManager(true);
  };

  // Funzione per spostare player tra clan
  const movePlayer = (playerId: number, fromClanId: number, toClanId: number) => {
    movePlayerMutation.mutate({ playerId, fromClanId, toClanId });
  };

  // Funzione per generare messaggio CWL
  const handleGenerateMessage = () => {
    if (clansWithPlayers.length === 0) {
      toast({
        title: "Errore",
        description: "Assegna i player ai clan prima di generare il messaggio",
        variant: "destructive",
      });
      return;
    }
    generateMessageMutation.mutate(clansWithPlayers);
  };

  // Funzione per esportare PDF
  const handleExportPdf = () => {
    if (!generatedMessage) {
      toast({
        title: "Errore",
        description: "Genera prima un messaggio da esportare",
        variant: "destructive",
      });
      return;
    }
    exportPdfMutation.mutate(generatedMessage);
  };

  // Funzione per cancellare tutti i player
  const handleClearPlayers = () => {
    if (confirm("Sei sicuro di voler cancellare tutti i player registrati?")) {
      clearPlayersMutation.mutate();
    }
  };

  // Funzione per cancellare tutti i clan
  const handleClearClans = () => {
    if (confirm("Sei sicuro di voler cancellare tutti i clan?")) {
      clearClansMutation.mutate();
    }
  };

  // Filtra i player in base alla ricerca
  const filteredPlayers = players.filter(player =>
    typeof player.nomePlayer === 'string' &&
    player.nomePlayer.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // Funzione per ottenere colore badge TH
  const getTHBadgeColor = (thLevel: number) => {
    if (thLevel >= 15) return "bg-blue-100 text-blue-800";
    if (thLevel >= 12) return "bg-green-100 text-green-800";
    if (thLevel >= 9) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8">
      {/* Header Admin */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="text-blue-500 mr-3 h-8 w-8" />
                Pannello Amministratore
              </h2>
              <p className="text-gray-600 mt-1">
                Gestisci player, clan, crea liste CWL e genera messaggi
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleExport} className="bg-green-500 hover:bg-green-600">
                <Download className="mr-2 h-4 w-4" />
                Esporta CSV
              </Button>
              <Button 
                onClick={handleExportPdf} 
                disabled={!generatedMessage || exportPdfMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Esporta PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">Player Registrati</TabsTrigger>
          <TabsTrigger value="clans">Gestione Clan</TabsTrigger>
          <TabsTrigger value="lists">Creazione Liste CWL</TabsTrigger>
          <TabsTrigger value="content">Modifica Contenuti</TabsTrigger>
        </TabsList>

        {/* TAB: Player Registrati */}
        <TabsContent value="players" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-500" />
                  Player Registrati
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {players.length} player
                  </span>
                  <Button 
                    onClick={handleClearPlayers}
                    variant="destructive"
                    size="sm"
                    disabled={clearPlayersMutation.isPending || players.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancella Tutti
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Barra di ricerca */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Cerca player per nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tabella Player */}
              {playersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Caricamento player...</p>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? "Nessun player trovato" : "Nessun player registrato"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome Player</TableHead>
                        <TableHead>Town Hall</TableHead>
                        <TableHead>Data Reg.</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="text-gray-500">
                            {player.id.toString().padStart(3, '0')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-blue-500 mr-3">👤</span>
                              <span className="font-medium">{player.nomePlayer}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTHBadgeColor(player.thPlayer)}>
                              TH {player.thPlayer}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {player.createdAt ? new Date(player.createdAt).toLocaleDateString('it-IT') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlayer(player.id, player.nomePlayer)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              disabled={deletePlayerMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiche */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiche Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats?.totalPlayers || 0}</div>
                  <div className="text-sm text-gray-600">Total Player</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats?.todayRegistrations || 0}</div>
                  <div className="text-sm text-gray-600">Reg. Oggi</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats?.avgTownHall || 0}</div>
                  <div className="text-sm text-gray-600">TH Medio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Gestione Clan */}
        <TabsContent value="clans" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form Aggiunta Clan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5 text-blue-500" />
                  Aggiungi Nuovo Clan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...clanForm}>
                  <form onSubmit={clanForm.handleSubmit(onSubmitClan)} className="space-y-4">
                    <FormField
                      control={clanForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Clan</FormLabel>
                          <FormControl>
                            <Input placeholder="Eclipse" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clanForm.control}
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partecipanti</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15">15 player</SelectItem>
                              <SelectItem value="30">30 player</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clanForm.control}
                      name="league"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lega</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Crystal I">Crystal I</SelectItem>
                              <SelectItem value="Crystal II">Crystal II</SelectItem>
                              <SelectItem value="Crystal III">Crystal III</SelectItem>
                              <SelectItem value="Master I">Master I</SelectItem>
                              <SelectItem value="Master II">Master II</SelectItem>
                              <SelectItem value="Master III">Master III</SelectItem>
                              <SelectItem value="Champion I">Champion I</SelectItem>
                              <SelectItem value="Champion II">Champion II</SelectItem>
                              <SelectItem value="Champion III">Champion III</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createClanMutation.isPending}>
                      {createClanMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Aggiungi Clan
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Lista Clan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                    Clan Configurati
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {clans.length} clan
                    </span>
                    <Button 
                      onClick={handleClearClans}
                      variant="destructive"
                      size="sm"
                      disabled={clearClansMutation.isPending || clans.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {clans.length === 0 ? (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nessun clan configurato</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clans.map((clan) => (
                      <div key={clan.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{clan.name}</h4>
                            <p className="text-sm text-gray-600">{clan.league} - {clan.participants} partecipanti</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Eliminare il clan "${clan.name}"?`)) {
                                // Implementa eliminazione singolo clan
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Azioni Generali */}
          <Card>
            <CardHeader>
              <CardTitle>Azioni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button 
                  onClick={assignPlayersToClans}
                  disabled={clans.length === 0 || players.length === 0}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Assegna Player ai Clan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Creazione Liste CWL */}
        <TabsContent value="lists" className="space-y-6">
          {!showPlayerManager ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-500" />
                  Creazione Liste CWL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Crea le tue liste CWL</h3>
                  <p className="text-gray-600 mb-6">
                    Prima configura i clan e poi assegna i player per creare le liste CWL
                  </p>
                  <Button 
                    onClick={assignPlayersToClans}
                    disabled={clans.length === 0 || players.length === 0}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Inizia Creazione Liste
                  </Button>
                  {clans.length === 0 && (
                    <p className="text-red-500 text-sm mt-2">
                      Aggiungi almeno un clan nella sezione "Gestione Clan"
                    </p>
                  )}
                  {players.length === 0 && (
                    <p className="text-red-500 text-sm mt-2">
                      Nessun player registrato trovato
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Gestione Assegnazioni Player */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <ArrowLeftRight className="mr-2 h-5 w-5 text-blue-500" />
                      Gestione Player nelle Liste CWL
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleGenerateMessage}
                        disabled={generateMessageMutation.isPending}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Genera Messaggio
                      </Button>
                      <Button 
                        onClick={() => setShowPlayerManager(false)}
                        variant="outline"
                      >
                        Torna Indietro
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {clansWithPlayers.map((clan) => (
                      <div key={clan.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{clan.name}</h4>
                            <p className="text-sm text-gray-600">{clan.league} - {clan.participants} partecipanti</p>
                          </div>
                          <Badge variant="outline">
                            {clan.players.length}/{clan.participants} player
                          </Badge>
                        </div>
                        
                        {/* Lista Player del Clan */}
                        <div className="space-y-2">
                          {clan.players.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nessun player assegnato</p>
                          ) : (
                            clan.players.map((player, index) => (
                              <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                                  <span className="font-medium">{player.nomePlayer}</span>
                                  <Badge className={getTHBadgeColor(player.thPlayer)}>
                                    TH{player.thPlayer}
                                  </Badge>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Muovi su
                                      if (index > 0) {
                                        const newPlayers = [...clan.players];
                                        [newPlayers[index], newPlayers[index - 1]] = [newPlayers[index - 1], newPlayers[index]];
                                        setClansWithPlayers(prev => 
                                          prev.map(c => c.id === clan.id ? { ...c, players: newPlayers } : c)
                                        );
                                      }
                                    }}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Muovi giù
                                      if (index < clan.players.length - 1) {
                                        const newPlayers = [...clan.players];
                                        [newPlayers[index], newPlayers[index + 1]] = [newPlayers[index + 1], newPlayers[index]];
                                        setClansWithPlayers(prev => 
                                          prev.map(c => c.id === clan.id ? { ...c, players: newPlayers } : c)
                                        );
                                      }
                                    }}
                                    disabled={index === clan.players.length - 1}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Sposta in altro clan
                                      const otherClans = clansWithPlayers.filter(c => c.id !== clan.id);
                                      if (otherClans.length > 0) {
                                        movePlayer(player.id, clan.id, otherClans[0].id);
                                      }
                                    }}
                                    className="text-blue-600"
                                  >
                                    <ArrowLeftRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Messaggio Generato */}
              {generatedMessage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-green-500" />
                      Messaggio CWL Generato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{generatedMessage}</pre>
                    </div>
                    <div className="mt-4">
                      <Button 
                        onClick={handleExportPdf}
                        disabled={exportPdfMutation.isPending}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Scarica PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Ricerca Clash of Clans Player */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5 text-orange-500" />
                Cerca Player Clash of Clans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Inserisci tag clan (es: #2Y8V9VG)"
                    value={selectedClanTag}
                    onChange={(e) => setSelectedClanTag(e.target.value)}
                  />
                  <Button 
                    onClick={() => refetchClashPlayers()}
                    disabled={!selectedClanTag || isLoadingClashPlayers}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Cerca
                  </Button>
                </div>

                {isLoadingClashPlayers && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Caricamento player...</p>
                  </div>
                )}

                {clashError && (
                  <div className="text-center py-4 text-red-600">
                    <p>Errore nel caricamento player del clan</p>
                  </div>
                )}

                {clashPlayers.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clashPlayers.map((player, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{player.name}</span>
                          <Badge className={getTHBadgeColor(player.townHallLevel)}>
                            TH{player.townHallLevel}
                          </Badge>
                          <span className="text-sm text-gray-600">{player.trophies} trofei</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Modifica Contenuti */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="mr-2 h-5 w-5 text-blue-500" />
                Modifica Contenuti Home Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...contentForm}>
                <form onSubmit={contentForm.handleSubmit(onSubmitContent)} className="space-y-4">
                  <FormField
                    control={contentForm.control}
                    name="clan_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Clan</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="clan_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione Clan</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="clan_rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regole Clan (una per riga)</FormLabel>
                        <FormControl>
                          <Textarea rows={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateContentMutation.isPending}
                  >
                    {updateContentMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salva Modifiche
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
