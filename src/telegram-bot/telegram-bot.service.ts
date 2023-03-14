import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import { WordTokenizer } from 'natural';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const wordnet = require('wordnet');

const tokenizer = new WordTokenizer();

@Injectable()
export class TelegramBotService {
  private readonly bot: Telegraf;
  private chatIds: number[] = [];
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.initProvider();
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.initBot();
    this.ethBlockSubscribe();
  }

  private initProvider = () => {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_PRIVIDER, 1);
  };

  private initBot = () => {
    this.bot.start((ctx) => {
      this.chatIds.push(ctx.chat.id);
      ctx.reply('Hello, I am a bot!');
    });

    this.bot.command('start', (ctx) => {
      this.chatIds.push(ctx.chat.id);
      ctx.reply('Hello, I am a bot!');
    });

    this.bot.command('stop', (ctx) => {
      this.chatIds = this.chatIds.filter((id) => id !== ctx.chat.id);
      ctx.reply('Bye, I am a bot!');
    });

    this.bot.command('help', (ctx) => {
      const message =
        `/init - зарегистрировать чат для отправки уведомлений` +
        `\n/stop - не отправлять уведомления в текущий чат` +
        `\n/amt - узнать количество записавшихся игроков`;
      return ctx.reply(message);
    });

    this.bot.launch();
  };

  public sendMessage = (message: string) => {
    this.chatIds.forEach((chatId) => {
      this.bot.telegram.sendMessage(chatId, message);
    });
  };

  private ethBlockSubscribe = async () => {
    await wordnet.init();

    const subscription = await this.provider.on(
      'block',
      async (blockNumber) => {
        const block = await this.provider.getBlock(blockNumber, true);

        (
          block as ethers.Block &
            {
              prefetchedTransactions: ethers.TransactionResponse[]; // hack bad ethers types
            }[]
        ).prefetchedTransactions.forEach(async (tx) => {
          const txText = await this.decodeBlockMessage(tx.data);
          if (!txText) return;

          const message = `New transaction received. \nBlock # ${blockNumber} \n Tx hash: ${tx.hash}. \nTx text: ${txText}`;
          this.sendMessage(message);
        });
      },
    );
  };

  private decodeBlockMessage = async (message: string) => {
    try {
      const decodedMessage = ethers.toUtf8String(message);
      const words = tokenizer.tokenize(decodedMessage);
      const isValid = await this.isMessageMeaningful(words);

      if (isValid) return decodedMessage;
      return null;
    } catch (error) {
      return null;
    }
  };

  private isMessageMeaningful = async (words: string[]) => {
    try {
      return words.some(async (word) => {
        const synsets = await wordnet.lookup(word.toLowerCase());

        return synsets.length > 0;
      });
    } catch (error) {
      return false;
    }
  };
}
