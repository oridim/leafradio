import { Migration } from '@mikro-orm/migrations';

export class Migration20260719164007 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table \`musical_features\` (\`musical_features_hash\` text not null primary key, \`arousal\` double not null, \`bpm\` integer not null, \`duration\` integer not null, \`key\` text not null, \`valence\` double not null);`);

    this.addSql(`create table \`radio\` (\`radio_id\` integer not null primary key autoincrement, \`name\` text not null, \`pack_playlist_buckets_parameters\` json null);`);

    this.addSql(`create table \`repository\` (\`repository_id\` integer not null primary key autoincrement, \`directory_path\` text not null, \`scan_state\` text check (\`scan_state\` in ('badScan', 'notScanning', 'interruptedScan', 'processingFiles', 'scanningDirectory', 'unscanned')) not null default 'unscanned');`);
    this.addSql(`create unique index \`repository_directory_path_unique\` on \`repository\` (\`directory_path\`);`);

    this.addSql(`create table \`radio_repositories\` (\`radio_radio_id\` integer not null, \`repository_repository_id\` integer not null, primary key (\`radio_radio_id\`, \`repository_repository_id\`), constraint \`radio_repositories_radio_radio_id_foreign\` foreign key (\`radio_radio_id\`) references \`radio\` (\`radio_id\`) on update cascade on delete cascade, constraint \`radio_repositories_repository_repository_id_foreign\` foreign key (\`repository_repository_id\`) references \`repository\` (\`repository_id\`) on update cascade on delete cascade);`);
    this.addSql(`create index \`radio_repositories_radio_radio_id_index\` on \`radio_repositories\` (\`radio_radio_id\`);`);
    this.addSql(`create index \`radio_repositories_repository_repository_id_index\` on \`radio_repositories\` (\`repository_repository_id\`);`);

    this.addSql(`create table \`audio_file\` (\`audio_file_id\` integer not null primary key autoincrement, \`last_modified\` integer not null, \`musical_features_musical_features_hash\` text not null, \`relative_file_path\` text not null, \`repository_repository_id\` integer not null, constraint \`audio_file_musical_features_musical_features_hash_foreign\` foreign key (\`musical_features_musical_features_hash\`) references \`musical_features\` (\`musical_features_hash\`), constraint \`audio_file_repository_repository_id_foreign\` foreign key (\`repository_repository_id\`) references \`repository\` (\`repository_id\`) on delete cascade);`);
    this.addSql(`create index \`audio_file_musical_features_musical_features_hash_index\` on \`audio_file\` (\`musical_features_musical_features_hash\`);`);
    this.addSql(`create index \`audio_file_repository_repository_id_index\` on \`audio_file\` (\`repository_repository_id\`);`);
    this.addSql(`create unique index \`audio_file_relative_file_path_repository_repository_id_unique\` on \`audio_file\` (\`relative_file_path\`, \`repository_repository_id\`);`);
  }

  override down(): void | Promise<void> {

    this.addSql(`drop table if exists \`musical_features\`;`);
    this.addSql(`drop table if exists \`radio\`;`);
    this.addSql(`drop table if exists \`repository\`;`);
    this.addSql(`drop table if exists \`radio_repositories\`;`);
    this.addSql(`drop table if exists \`audio_file\`;`);
  }

}
