import { Migration } from '@mikro-orm/migrations';

export class Migration20260721160520 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table \`processed_metadata\` (\`pcm_hash\` text not null primary key, \`audio_properties\` json not null, \`musical_features\` json not null);`);

    this.addSql(`create table \`audio_file\` (\`audio_file_id\` integer not null primary key autoincrement, \`absolute_file_path\` text not null, \`last_modified\` integer not null, \`processed_metadata_pcm_hash\` text not null, constraint \`audio_file_processed_metadata_pcm_hash_foreign\` foreign key (\`processed_metadata_pcm_hash\`) references \`processed_metadata\` (\`pcm_hash\`));`);
    this.addSql(`create unique index \`audio_file_absolute_file_path_unique\` on \`audio_file\` (\`absolute_file_path\`);`);
    this.addSql(`create index \`audio_file_processed_metadata_pcm_hash_index\` on \`audio_file\` (\`processed_metadata_pcm_hash\`);`);
  }

  override down(): void | Promise<void> {

    this.addSql(`drop table if exists \`processed_metadata\`;`);
    this.addSql(`drop table if exists \`audio_file\`;`);
  }

}
