CREATE TYPE "public"."action_type" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('NOVICE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');--> statement-breakpoint
CREATE TYPE "public"."instrument_type" AS ENUM('CALL', 'PUT', 'STOCK');--> statement-breakpoint
CREATE TYPE "public"."market_outlook" AS ENUM('BULLISH', 'BEARISH', 'NEUTRAL');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('NOVICE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');--> statement-breakpoint
CREATE TYPE "public"."reward_profile" AS ENUM('CAPPED', 'UNCAPPED');--> statement-breakpoint
CREATE TYPE "public"."risk_profile" AS ENUM('CAPPED', 'UNCAPPED');--> statement-breakpoint
CREATE TYPE "public"."strategy_type" AS ENUM('CAPITAL_GAIN', 'INCOME', 'PROTECTION');--> statement-breakpoint
CREATE TYPE "public"."strike_relation" AS ENUM('ATM', 'ITM', 'OTM');--> statement-breakpoint
CREATE TYPE "public"."volatility_view" AS ENUM('HIGH', 'LOW');--> statement-breakpoint
CREATE TABLE "external_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_legs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"simulation_id" uuid NOT NULL,
	"instrument_type" "instrument_type" NOT NULL,
	"action" "action_type" NOT NULL,
	"quantity" integer NOT NULL,
	"entry_price" numeric(18, 2) NOT NULL,
	"exit_price" numeric(18, 2),
	"entry_date" timestamp NOT NULL,
	"exit_date" timestamp,
	"profit_loss" numeric(18, 2)
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"asset_symbol" varchar(20) NOT NULL,
	"simulation_name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"initial_capital" numeric(18, 2) NOT NULL,
	"total_return" numeric(18, 2),
	"return_percentage" numeric(18, 4),
	"max_drawdown" numeric(18, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"summary" text,
	"description" text,
	"proficiency_level" "proficiency_level" NOT NULL,
	"market_outlook" "market_outlook" NOT NULL,
	"volatility_view" "volatility_view" NOT NULL,
	"risk_profile" "risk_profile" NOT NULL,
	"reward_profile" "reward_profile" NOT NULL,
	"strategy_type" "strategy_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_legs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"action" "action_type" NOT NULL,
	"instrument_type" "instrument_type" NOT NULL,
	"quantity_ratio" integer NOT NULL,
	"strike_relation" "strike_relation" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"experience_level" "experience_level" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_legs" ADD CONSTRAINT "simulation_legs_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_legs" ADD CONSTRAINT "strategy_legs_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;