import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Crown, Medal, CheckCircle } from "lucide-react";
import { Content } from "@shared/schema";

interface HomeProps {
  onTabChange: (tab: string) => void;
}

export default function Home({ onTabChange }: HomeProps) {
  // Carica i contenuti dal database
  const { data: contents = [], isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });

  // Carica le statistiche
  const { data: stats } = useQuery<{
    totalPlayers: number;
    todayRegistrations: number;
    avgTownHall: number;
  }>({
    queryKey: ["/api/stats"],
  });

  // Converte array di contenuti in oggetto per accesso facile
  const contentMap = contents.reduce((acc, content) => {
    acc[content.key] = content.value;
    return acc;
  }, {} as Record<string, string>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  const rules = contentMap.clan_rules?.split('\n') || [];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Sezione principale */}
      <div className="lg:col-span-2">
        {/* Banner del clan */}
        <div className="relative rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-blue-500 to-blue-700">
          <div className="px-8 py-12 text-white">
            <h1 className="text-4xl font-bold mb-4">
              {contentMap.clan_name || "CWL Manager"}
            </h1>
            <p className="text-xl mb-6 opacity-90">
              {contentMap.clan_description || "Sistema di gestione Clan War League"}
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Users className="text-yellow-400 mr-2 h-5 w-5" />
                <span>{contentMap.member_count || "0/50 Membri"}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="text-yellow-400 mr-2 h-5 w-5" />
                <span>{contentMap.clan_trophies || "0 Trofei"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card statistiche */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">CWL Attuale</h3>
                  <p className="text-3xl font-bold text-blue-500">
                    {contentMap.cwl_league || "Non impostato"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {contentMap.cwl_status || "In attesa"}
                  </p>
                </div>
                <Medal className="text-yellow-500 h-12 w-12" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Vittorie CWL</h3>
                  <p className="text-3xl font-bold text-green-500">
                    {contentMap.cwl_wins || "0/0"}
                  </p>
                  <p className="text-sm text-gray-600">Questa stagione</p>
                </div>
                <Crown className="text-yellow-500 h-12 w-12" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regole del clan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              📜 Regole del Clan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-gray-700">{rule}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Statistiche rapide */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiche Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Iscritti CWL:</span>
                <span className="font-semibold text-blue-500">
                  {stats?.totalPlayers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Media TH:</span>
                <span className="font-semibold text-blue-500">
                  {stats?.avgTownHall || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reg. Oggi:</span>
                <span className="font-semibold text-green-500">
                  {stats?.todayRegistrations || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Registrazione */}
        <Card className="bg-gradient-to-r from-blue-500 to-yellow-500 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold mb-2">Unisciti alle CWL!</h3>
            <p className="text-sm mb-4 opacity-90">
              Registrati ora per partecipare alle prossime Clan War League
            </p>
            <Button
              onClick={() => onTabChange("register")}
              className="bg-white text-blue-500 hover:bg-gray-100"
            >
              Registrati Ora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
