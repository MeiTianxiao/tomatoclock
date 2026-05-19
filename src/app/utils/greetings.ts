import { RankLevel } from '../types';
import { RANKS } from '../constants';

export function getGreeting(rank: RankLevel): string {
  const rankData = RANKS[rank];
  const greetings: Record<RankLevel, string[]> = {
    intern: [
      '每一步都是成长，加油！',
      '从实习生开始，未来可期！',
      '万丈高楼平地起，继续努力！',
      '保持专注，你一定能做到！'
    ],
    staff: [
      '科员同志辛苦了，继续保持！',
      '稳扎稳打，向更高目标前进！',
      '你的努力大家都看在眼里！',
      '专注成就卓越，加油！'
    ],
    deputy_chief_staff: [
      '副主任科员，实力逐渐展现！',
      '你的进步有目共睹！',
      '继续这样的节奏，很棒！',
      '距离下一个目标越来越近了！'
    ],
    chief_staff: [
      '主任科员，能力已经得到认可！',
      '你的专注力令人钦佩！',
      '保持这份专注，再接再厉！',
      '优秀的表现，继续努力！'
    ],
    deputy_section_chief: [
      '副科长，管理能力逐步提升！',
      '你已经超越了很多人！',
      '这周表现优异，保持住！',
      '向科长冲刺，胜利在望！'
    ],
    section_chief: [
      '科长好！您的专注力堪称楷模！',
      '28小时的专注，非常了不起！',
      '继续保持，更高职位在等你！',
      '您是团队的榜样！'
    ],
    deputy_director: [
      '副处长，您的毅力令人敬佩！',
      '42小时的专注，实在不易！',
      '离处长只有一步之遥了！',
      '坚持就是胜利，加油！'
    ],
    director: [
      '处长好！56小时的成就非凡！',
      '您的专注力已达到顶尖水平！',
      '向局长发起最后冲刺吧！',
      '这样的毅力必将成就大事！'
    ],
    deputy_bureau_chief: [
      '副局长，您离巅峰仅一步之遥！',
      '63小时的专注，令人震撼！',
      '最后的冲刺，你一定行！',
      '局长之位指日可待！'
    ],
    bureau_chief: [
      '局长万岁！您已站在巅峰！',
      '70小时的专注，无人能及！',
      '您是本周的专注之王！',
      '卓越的成就，值得骄傲！'
    ]
  };

  const messages = greetings[rank];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) {
    return '早上好！新的一天，新的开始！';
  } else if (hour >= 8 && hour < 12) {
    return '上午好！趁着精力充沛，好好专注吧！';
  } else if (hour >= 12 && hour < 14) {
    return '中午好！午休过后专注效率更高哦！';
  } else if (hour >= 14 && hour < 18) {
    return '下午好！保持专注，冲刺今日目标！';
  } else if (hour >= 18 && hour < 23) {
    return '晚上好！夜深人静，正是专注的好时光！';
  } else {
    return '夜深了，注意休息，健康最重要！';
  }
}

export function getWeekProgress(weeklyMinutes: number): string {
  const hours = Math.floor(weeklyMinutes / 60);

  if (hours < 14) {
    return `本周已专注 ${hours} 小时，距离科员还需 ${14 - hours} 小时`;
  } else if (hours < 28) {
    return `本周已专注 ${hours} 小时，距离科长还需 ${28 - hours} 小时`;
  } else if (hours < 56) {
    return `本周已专注 ${hours} 小时，距离处长还需 ${56 - hours} 小时`;
  } else if (hours < 70) {
    return `本周已专注 ${hours} 小时，距离局长还需 ${70 - hours} 小时`;
  } else {
    return `本周已专注 ${hours} 小时，您已经是局长了！`;
  }
}
