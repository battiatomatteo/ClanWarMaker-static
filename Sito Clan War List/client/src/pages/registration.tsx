import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { insertPlayerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle } from "lucide-react";
import { z } from "zod";

// Schema di validazione esteso con checkbox di accordo
const registrationSchema = insertPlayerSchema.extend({
  agreement: z.boolean().refine(val => val === true, {
    message: "Devi accettare i termini per continuare"
  })
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Registration() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      nomePlayer: "",
      thPlayer: 12,
      agreement: false,
    },
  });

  // Mutation per registrare un nuovo player
  const registerPlayerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      // Rimuovi il campo agreement prima di inviare al server
      const { agreement, ...playerData } = data;
      return apiRequest("POST", "/api/players", playerData);
    },
    onSuccess: () => {
      // Invalida la cache per aggiornare le statistiche
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      setIsSuccess(true);
      form.reset();
      
      toast({
        title: "Registrazione completata!",
        description: "Ti sei registrato con successo alle CWL.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore nella registrazione",
        description: error.message || "Si è verificato un errore imprevisto.",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    registerPlayerMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="text-green-500 h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registrazione Completata!
            </h2>
            <p className="text-gray-600 mb-6">
              Ti sei registrato con successo alle CWL. Controlla la chat del clan per aggiornamenti.
            </p>
            <Button onClick={() => setIsSuccess(false)}>
              Registra un altro player
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <UserPlus className="text-blue-500 h-12 w-12 mx-auto mb-4" />
          <CardTitle className="text-3xl">Registrazione CWL</CardTitle>
          <p className="text-gray-600">
            Compila il form per registrarti alle prossime Clan War League
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Nome Player */}
              <FormField
                control={form.control}
                name="nomePlayer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      👤 Nome Player
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Inserisci il tuo nome in game"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Usa esattamente il nome che hai in Clash of Clans
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Town Hall Level */}
              <FormField
                control={form.control}
                name="thPlayer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      🏠 Livello Town Hall
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tuo TH" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12">Town Hall 12</SelectItem>
                        <SelectItem value="13">Town Hall 13</SelectItem>
                        <SelectItem value="14">Town Hall 14</SelectItem>
                        <SelectItem value="15">Town Hall 15</SelectItem>
                        <SelectItem value="16">Town Hall 16</SelectItem>
                        <SelectItem value="17">Town Hall 17</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Minimo TH12 per partecipare alle CWL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox accordo */}
              <FormField
                control={form.control}
                name="agreement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Accetto di partecipare alle CWL e di rispettare le regole del clan.
                        Mi impegno a completare tutti gli attacchi assegnati.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={registerPlayerMutation.isPending}
              >
                {registerPlayerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrazione in corso...
                  </>
                ) : (
                  <>
                    ✅ Registrati alle CWL
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
