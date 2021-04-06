import * as obsidian from "obsidian";

declare module "obsidian" {
  class VaultEx extends Vault{
    getConfig(key:string):string
  }
}