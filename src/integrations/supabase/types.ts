export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      animales: {
        Row: {
          activo: boolean
          color: string | null
          created_at: string
          created_by: string | null
          fecha_nacimiento: string | null
          finca_id: string
          foto_principal_url: string | null
          id: string
          madre_id: string | null
          nombre: string | null
          numero: string
          numero_registro: string | null
          padre_id: string | null
          raza: string | null
          sexo: Database["public"]["Enums"]["animal_sexo"] | null
          tipo: Database["public"]["Enums"]["animal_tipo"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          fecha_nacimiento?: string | null
          finca_id: string
          foto_principal_url?: string | null
          id?: string
          madre_id?: string | null
          nombre?: string | null
          numero: string
          numero_registro?: string | null
          padre_id?: string | null
          raza?: string | null
          sexo?: Database["public"]["Enums"]["animal_sexo"] | null
          tipo: Database["public"]["Enums"]["animal_tipo"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          fecha_nacimiento?: string | null
          finca_id?: string
          foto_principal_url?: string | null
          id?: string
          madre_id?: string | null
          nombre?: string | null
          numero?: string
          numero_registro?: string | null
          padre_id?: string | null
          raza?: string | null
          sexo?: Database["public"]["Enums"]["animal_sexo"] | null
          tipo?: Database["public"]["Enums"]["animal_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animales_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "fincas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animales_madre_id_fkey"
            columns: ["madre_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animales_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      app_assets: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      aspiraciones: {
        Row: {
          animal_id: string
          cantidad_ovocitos: number | null
          created_at: string
          fecha: string
          id: string
          notas: string | null
          responsable_id: string
        }
        Insert: {
          animal_id: string
          cantidad_ovocitos?: number | null
          created_at?: string
          fecha: string
          id?: string
          notas?: string | null
          responsable_id: string
        }
        Update: {
          animal_id?: string
          cantidad_ovocitos?: number | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          responsable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aspiraciones_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          cambios: Json | null
          created_at: string
          id: string
          registro_id: string
          tabla: string
          usuario_display_name: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          cambios?: Json | null
          created_at?: string
          id?: string
          registro_id: string
          tabla: string
          usuario_display_name?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          cambios?: Json | null
          created_at?: string
          id?: string
          registro_id?: string
          tabla?: string
          usuario_display_name?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      chequeos_veterinarios: {
        Row: {
          animal_id: string
          created_at: string
          diagnostico: string | null
          estado: string | null
          fecha: string
          id: string
          notas: string | null
          responsable_id: string
          veterinario: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          diagnostico?: string | null
          estado?: string | null
          fecha: string
          id?: string
          notas?: string | null
          responsable_id: string
          veterinario?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          diagnostico?: string | null
          estado?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          responsable_id?: string
          veterinario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chequeos_veterinarios_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos_calor: {
        Row: {
          animal_id: string
          created_at: string
          fecha: string
          fecha_proximo_estimado: string | null
          id: string
          notas: string | null
          responsable_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          fecha: string
          fecha_proximo_estimado?: string | null
          id?: string
          notas?: string | null
          responsable_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          fecha?: string
          fecha_proximo_estimado?: string | null
          id?: string
          notas?: string | null
          responsable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_calor_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      dietas: {
        Row: {
          animal_id: string
          cantidad_kg_dia: number | null
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          notas: string | null
          responsable_id: string
          tipo_alimento: string
        }
        Insert: {
          animal_id: string
          cantidad_kg_dia?: number | null
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          notas?: string | null
          responsable_id: string
          tipo_alimento: string
        }
        Update: {
          animal_id?: string
          cantidad_kg_dia?: number | null
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          responsable_id?: string
          tipo_alimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "dietas_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      embriones_detalle: {
        Row: {
          animal_id: string
          created_at: string
          donadora_id: string | null
          estado_embrion: Database["public"]["Enums"]["embrion_estado"] | null
          fecha_transferencia: string | null
          id: string
          notas: string | null
          receptora_id: string | null
          responsable_id: string
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          donadora_id?: string | null
          estado_embrion?: Database["public"]["Enums"]["embrion_estado"] | null
          fecha_transferencia?: string | null
          id?: string
          notas?: string | null
          receptora_id?: string | null
          responsable_id: string
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          donadora_id?: string | null
          estado_embrion?: Database["public"]["Enums"]["embrion_estado"] | null
          fecha_transferencia?: string | null
          id?: string
          notas?: string | null
          receptora_id?: string | null
          responsable_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "embriones_detalle_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: true
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embriones_detalle_donadora_id_fkey"
            columns: ["donadora_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embriones_detalle_receptora_id_fkey"
            columns: ["receptora_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      embriones_recolectados: {
        Row: {
          animal_id_donadora: string
          calidad: string | null
          cantidad: number | null
          created_at: string
          fecha: string
          id: string
          notas: string | null
          responsable_id: string
        }
        Insert: {
          animal_id_donadora: string
          calidad?: string | null
          cantidad?: number | null
          created_at?: string
          fecha: string
          id?: string
          notas?: string | null
          responsable_id: string
        }
        Update: {
          animal_id_donadora?: string
          calidad?: string | null
          cantidad?: number | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          responsable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embriones_recolectados_animal_id_donadora_fkey"
            columns: ["animal_id_donadora"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      fincas: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          foto_url: string | null
          hectareas: number | null
          id: string
          nombre: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          foto_url?: string | null
          hectareas?: number | null
          id?: string
          nombre: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          foto_url?: string | null
          hectareas?: number | null
          id?: string
          nombre?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inseminaciones: {
        Row: {
          animal_id: string
          created_at: string
          fecha: string
          hora: string | null
          id: string
          metodo: Database["public"]["Enums"]["metodo_cruce"]
          notas: string | null
          responsable_id: string
          toro_externo_nombre: string | null
          toro_id: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          fecha: string
          hora?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["metodo_cruce"]
          notas?: string | null
          responsable_id: string
          toro_externo_nombre?: string | null
          toro_id?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          fecha?: string
          hora?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_cruce"]
          notas?: string | null
          responsable_id?: string
          toro_externo_nombre?: string | null
          toro_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inseminaciones_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inseminaciones_toro_id_fkey"
            columns: ["toro_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      medicaciones: {
        Row: {
          animal_id: string
          created_at: string
          dias_tratamiento: number | null
          dosis: string | null
          fecha: string
          id: string
          medicamento: string
          motivo: string | null
          notas: string | null
          responsable_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          dias_tratamiento?: number | null
          dosis?: string | null
          fecha: string
          id?: string
          medicamento: string
          motivo?: string | null
          notas?: string | null
          responsable_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          dias_tratamiento?: number | null
          dosis?: string | null
          fecha?: string
          id?: string
          medicamento?: string
          motivo?: string | null
          notas?: string | null
          responsable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicaciones_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      palpaciones: {
        Row: {
          animal_id: string
          created_at: string
          fecha: string
          id: string
          notas: string | null
          responsable_id: string
          resultado: Database["public"]["Enums"]["palpacion_resultado"]
          tiempo_prenez_dias: number | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          fecha: string
          id?: string
          notas?: string | null
          responsable_id: string
          resultado: Database["public"]["Enums"]["palpacion_resultado"]
          tiempo_prenez_dias?: number | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          responsable_id?: string
          resultado?: Database["public"]["Enums"]["palpacion_resultado"]
          tiempo_prenez_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "palpaciones_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      partos: {
        Row: {
          animal_id_madre: string
          created_at: string
          cria_id: string | null
          fecha: string
          id: string
          notas: string | null
          numero_parto: number | null
          responsable_id: string
          resultado: Database["public"]["Enums"]["parto_resultado"]
          sexo_cria: Database["public"]["Enums"]["animal_sexo"] | null
        }
        Insert: {
          animal_id_madre: string
          created_at?: string
          cria_id?: string | null
          fecha: string
          id?: string
          notas?: string | null
          numero_parto?: number | null
          responsable_id: string
          resultado: Database["public"]["Enums"]["parto_resultado"]
          sexo_cria?: Database["public"]["Enums"]["animal_sexo"] | null
        }
        Update: {
          animal_id_madre?: string
          created_at?: string
          cria_id?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          numero_parto?: number | null
          responsable_id?: string
          resultado?: Database["public"]["Enums"]["parto_resultado"]
          sexo_cria?: Database["public"]["Enums"]["animal_sexo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "partos_animal_id_madre_fkey"
            columns: ["animal_id_madre"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partos_cria_id_fkey"
            columns: ["cria_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      pesajes: {
        Row: {
          animal_id: string
          created_at: string
          evidencia_url: string | null
          fecha: string
          ganancia_desde_anterior_kg: number | null
          id: string
          peso_kg: number
          responsable_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          evidencia_url?: string | null
          fecha: string
          ganancia_desde_anterior_kg?: number | null
          id?: string
          peso_kg: number
          responsable_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          evidencia_url?: string | null
          fecha?: string
          ganancia_desde_anterior_kg?: number | null
          id?: string
          peso_kg?: number
          responsable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pesajes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          display_name: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          display_name: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_finca_acceso: {
        Row: {
          created_at: string
          created_by: string | null
          finca_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          finca_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          finca_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacunaciones: {
        Row: {
          animal_id: string
          created_at: string
          fecha: string
          id: string
          lote: string | null
          notas: string | null
          proxima_dosis: string | null
          responsable_id: string
          vacuna: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          fecha: string
          id?: string
          lote?: string | null
          notas?: string | null
          proxima_dosis?: string | null
          responsable_id: string
          vacuna: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          fecha?: string
          id?: string
          lote?: string | null
          notas?: string | null
          proxima_dosis?: string | null
          responsable_id?: string
          vacuna?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacunaciones_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_super: { Args: { _user_id: string }; Returns: boolean }
      user_can_access_animal: {
        Args: { _animal_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_finca: {
        Args: { _finca_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      animal_sexo: "M" | "H"
      animal_tipo: "macho" | "hembra" | "cria" | "embrion" | "otro"
      app_role: "super_admin" | "admin" | "operario"
      embrion_estado:
        | "congelado"
        | "transferido"
        | "implantado"
        | "perdido"
        | "nacido"
      metodo_cruce:
        | "monta_directa"
        | "inseminacion_artificial"
        | "fiv"
        | "transferencia_embrion"
      palpacion_resultado: "positivo" | "negativo"
      parto_resultado: "vivo" | "muerto" | "aborto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      animal_sexo: ["M", "H"],
      animal_tipo: ["macho", "hembra", "cria", "embrion", "otro"],
      app_role: ["super_admin", "admin", "operario"],
      embrion_estado: [
        "congelado",
        "transferido",
        "implantado",
        "perdido",
        "nacido",
      ],
      metodo_cruce: [
        "monta_directa",
        "inseminacion_artificial",
        "fiv",
        "transferencia_embrion",
      ],
      palpacion_resultado: ["positivo", "negativo"],
      parto_resultado: ["vivo", "muerto", "aborto"],
    },
  },
} as const
