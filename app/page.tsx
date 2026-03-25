'use client';

import { useState, useMemo } from 'react';
import { MapPin, Navigation, ChevronRight, X, ZoomIn, Building2, Locate, ArrowUpRight } from 'lucide-react';

// 页面状态类型
type PageState = 'input' | 'navigation' | 'map-zoom';

// 起点类型
type StartType = 'elevator' | 'room';

// 电梯位置说明
const elevatorLocations = [
  { id: 'A', name: 'A电梯', position: '北侧走廊', description: '北侧中部' },
  { id: 'B', name: 'B电梯', position: '南侧走廊', description: '南侧中部' },
  { id: 'C', name: 'C电梯', position: '北侧走廊', description: '北侧东部' },
  { id: 'D', name: 'D电梯', position: '南侧走廊', description: '南侧东部' },
];

// 房间数据类型 - 支持路径计算
interface RoomData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type?: 'elevator' | 'stair' | 'feature' | 'restroom' | 'corridor';
  corridor?: 'north' | 'south' | 'east' | 'west' | 'center' | 'north-west' | 'north-east' | 'south-west' | 'south-east' | 'east-north' | 'east-south' | 'center-west' | 'center-east';
  // 用于路径计算的节点
  pathNode?: { x: number; y: number };
}

// 楼层配置
const floorConfig: Record<number, { rooms: string[]; features: string[]; elevators: string[] }> = {
  1: {
    rooms: ['FZ101', 'FZ102', 'FZ103', 'FZ104', 'FZ105', 'FZ106', 'FZ107', 'FZ108', 'FZ109', 'FZ110',
            'FZ111', 'FZ112', 'FZ113', 'FZ114', 'FZ115', 'FZ117', 'FZ118', 'FZ119', 'FZ120', 'FZ121',
            'FZ122', 'FZ123', 'FZ124', 'FZ125', 'FZ126', 'FZ127', 'FZ128', 'FZ129', 'FZ130', 'FZ131',
            'FZ132', 'FZ133', 'FZ134', 'FZ135', 'FZ136', 'FZ137', 'FZ138', 'FZ139', 'FZ140', 'FZ141',
            'FZ142', 'FZ143', 'FZ144', 'FZ145', 'FZ146', 'FZ151', 'FZ152', 'FZ158', 'FZ159', 'FZ160',
            'FZ161', 'FZ162', 'FZ232', 'FZ233', 'FZ234', 'FZ235', 'FZ236', 'FZ237', 'FZ238', 'FZ239',
            'FZ240', 'FZ241', 'FZ242', 'FZ447', 'FZ448',
            'FF101', 'FF104', 'FF105', 'FF106', 'FF107', 'FF108', 'FF109'],
    features: ['逸夫报告厅', '实验室', '乒乓球室', '羽毛球室', '大厅', '电动车停车场'],
    elevators: ['A', 'B', 'C', 'D']
  },
  2: {
    rooms: ['FZ201', 'FZ202', 'FZ203', 'FZ204', 'FZ205', 'FZ206', 'FZ207', 'FZ208', 'FZ209', 'FZ210',
            'FZ211', 'FZ212', 'FZ213', 'FZ214', 'FZ215', 'FZ216', 'FZ217', 'FZ218', 'FZ219', 'FZ220',
            'FZ221', 'FZ222', 'FZ223', 'FZ224', 'FZ225', 'FZ226', 'FZ227', 'FZ228', 'FZ229', 'FZ230',
            'FZ231', 'FZ232', 'FZ233', 'FZ234', 'FZ235', 'FZ236', 'FZ237', 'FZ238', 'FZ239', 'FZ240',
            'FZ241', 'FZ242', 'FZ243', 'FZ244',
            'FF201', 'FF202', 'FF203', 'FF204', 'FF205', 'FF206', 'FF207', 'FF208'],
    features: ['逸夫报告厅'],
    elevators: ['A', 'B', 'C', 'D']
  },
  3: {
    rooms: ['FZ301', 'FZ302', 'FZ303', 'FZ304', 'FZ305', 'FZ306', 'FZ307', 'FZ308', 'FZ309', 'FZ310',
            'FZ311', 'FZ312', 'FZ313', 'FZ314', 'FZ315', 'FZ316', 'FZ317', 'FZ318', 'FZ319', 'FZ320',
            'FZ321', 'FZ322', 'FZ323', 'FZ324', 'FZ325', 'FZ326', 'FZ327', 'FZ328', 'FZ329', 'FZ330',
            'FZ331', 'FZ332', 'FZ333', 'FZ334', 'FZ335', 'FZ336', 'FZ337', 'FZ338', 'FZ339', 'FZ340',
            'FZ341', 'FZ342', 'FZ343', 'FZ344',
            'FF301', 'FF302', 'FF303', 'FF304', 'FF305', 'FF306', 'FF307', 'FF308'],
    features: ['逸夫报告厅'],
    elevators: ['A', 'B', 'C', 'D']
  },
  4: {
    rooms: ['FZ401', 'FZ402', 'FZ403', 'FZ404', 'FZ405', 'FZ406', 'FZ407', 'FZ408', 'FZ409', 'FZ410',
            'FZ411', 'FZ412', 'FZ413', 'FZ414', 'FZ415', 'FZ416', 'FZ417', 'FZ418', 'FZ419', 'FZ420',
            'FZ421', 'FZ422', 'FZ423', 'FZ424', 'FZ425', 'FZ426', 'FZ427', 'FZ428', 'FZ429', 'FZ430',
            'FZ431', 'FZ432', 'FZ433', 'FZ434', 'FZ435', 'FZ436', 'FZ437', 'FZ438', 'FZ439', 'FZ440',
            'FZ441', 'FZ442', 'FZ444',
            'FF401', 'FF402', 'FF403', 'FF404', 'FF405', 'FF406', 'FF407', 'FF408'],
    features: ['逸夫报告厅'],
    elevators: ['A', 'B', 'C', 'D']
  },
  5: {
    rooms: ['FZ501', 'FZ502', 'FZ503', 'FZ504', 'FZ505', 'FZ506', 'FZ507', 'FZ508', 'FZ509', 'FZ510',
            'FZ511', 'FZ512', 'FZ513', 'FZ514', 'FZ515', 'FZ516', 'FZ517', 'FZ518', 'FZ519', 'FZ520',
            'FZ521', 'FZ522', 'FZ523', 'FZ524', 'FZ525', 'FZ526', 'FZ527', 'FZ528', 'FZ529', 'FZ530',
            'FZ531', 'FZ532', 'FZ533', 'FZ534', 'FZ535', 'FZ536', 'FZ537', 'FZ538', 'FZ539', 'FZ540',
            'FZ541', 'FZ542', 'FZ543', 'FZ544', 'FZ545', 'FZ546', 'FZ547', 'FZ548', 'FZ549', 'FZ550',
            'FZ551', 'FZ552', 'FZ553', 'FZ554', 'FZ555', 'FZ556', 'FZ557', 'FZ558', 'FZ559'],
    features: ['西侧内廊'],
    elevators: ['A', 'B', 'C', 'D']
  },
  6: {
    rooms: ['FZ601', 'FZ603', 'FZ604', 'FZ605', 'FZ606', 'FZ607', 'FZ608', 'FZ609', 'FZ610', 'FZ611',
            'FZ612', 'FZ613', 'FZ614', 'FZ615', 'FZ616', 'FZ617', 'FZ618', 'FZ619', 'FZ620', 'FZ621',
            'FZ622', 'FZ623', 'FZ624', 'FZ625', 'FZ626', 'FZ627', 'FZ628', 'FZ629', 'FZ630', 'FZ632',
            'FZ633', 'FZ634', 'FZ635', 'FZ636', 'FZ637', 'FZ638', 'FZ639', 'FZ640', 'FZ641', 'FZ642',
            'FZ643', 'FZ644', 'FZ645', 'FZ646', 'FZ647', 'FZ648', 'FZ649', 'FZ650', 'FZ651', 'FZ652',
            'FZ653', 'FZ654', 'FZ655', 'FZ656', 'FZ657', 'FZ658', 'FZ659', 'FZ661',
            'FF502', 'FF503', 'FF504', 'FF505', 'FF506', 'FF507', 'FF508', 'FF509', 'FF510', 'FF511'],
    features: ['中手游', '休闲区', '西侧功能房'],
    elevators: ['A', 'B', 'C', 'D']
  },
  7: {
    rooms: ['FZ701', 'FZ702', 'FZ703', 'FZ704', 'FZ705', 'FZ706', 'FZ707', 'FZ708', 'FZ709', 'FZ710',
            'FZ711', 'FZ712', 'FZ713', 'FZ714', 'FZ715', 'FZ716', 'FZ717', 'FZ718', 'FZ719', 'FZ720',
            'FZ721', 'FZ722', 'FZ723', 'FZ724', 'FZ725', 'FZ726', 'FZ727', 'FZ728', 'FZ729', 'FZ730',
            'FF701', 'FF702', 'FF703', 'FF704', 'FF705', 'FF706'],
    features: ['图书馆', '自习室', '现刊阅览室'],
    elevators: ['A', 'B', 'C', 'D']
  },
  8: {
    rooms: ['FZ807', 'FZ808', 'FZ809', 'FZ810', 'FZ811', 'FZ812', 'FZ815', 'FZ816', 'FZ817', 'FZ818',
            'FZ819', 'FZ820', 'FZ822', 'FZ825', 'FZ826', 'FZ827', 'FZ828', 'FZ829', 'FZ830', 'FZ831',
            'FF701', 'FF702', 'FF703', 'FF704', 'FF705', 'FF706'],
    features: ['网络舆情监测中心', '电子商务创新中心', '西部数字研究院', '自修室'],
    elevators: ['A', 'B', 'C', 'D']
  }
};

const floors = [1, 2, 3, 4, 5, 6, 7, 8];

// ==================== 二楼平面图 ====================
// U型布局：北、南、东三个方向房间带，中心逸夫报告厅
// 布局规则：房间在走廊外侧，走廊在中间
// 连通性：东侧走廊贯通，南北走廊在电梯A-C、B-D之间断开
const floor2Rooms: RoomData[] = [
  // ========== 北侧房间（走廊上方）==========
  // 西段（从西到东）
  { id: 'FZ201', x: 40, y: 15, width: 50, height: 45, label: '201', corridor: 'north', pathNode: { x: 65, y: 95 } },
  { id: 'FZ202', x: 95, y: 15, width: 50, height: 45, label: '202', corridor: 'north', pathNode: { x: 120, y: 95 } },
  { id: 'FZ203', x: 150, y: 15, width: 50, height: 45, label: '203', corridor: 'north', pathNode: { x: 175, y: 95 } },
  
  // 北侧楼梯（西侧）
  { id: 'stair-NW', x: 205, y: 15, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  { id: 'FZ204', x: 260, y: 15, width: 45, height: 45, label: '204', corridor: 'north', pathNode: { x: 282, y: 95 } },
  { id: 'FZ205', x: 310, y: 15, width: 45, height: 45, label: '205', corridor: 'north', pathNode: { x: 332, y: 95 } },
  { id: 'FZ206', x: 360, y: 15, width: 45, height: 45, label: '206', corridor: 'north', pathNode: { x: 382, y: 95 } },
  { id: 'FZ207', x: 410, y: 15, width: 45, height: 45, label: '207', corridor: 'north', pathNode: { x: 432, y: 95 } },
  { id: 'FZ208', x: 460, y: 15, width: 45, height: 45, label: '208', corridor: 'north', pathNode: { x: 482, y: 95 } },
  { id: 'FZ209', x: 510, y: 15, width: 45, height: 45, label: '209', corridor: 'north', pathNode: { x: 532, y: 95 } },
  { id: 'FZ210', x: 560, y: 15, width: 45, height: 45, label: '210', corridor: 'north', pathNode: { x: 582, y: 95 } },
  
  // A电梯（北侧西段，走廊内）
  { id: 'A-elevator', x: 615, y: 65, width: 50, height: 50, label: 'A\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 640, y: 90 } },
  
  // ========== 断开区域 ==========
  // 中心逸夫报告厅
  
  // C电梯（北侧东段，走廊内）
  { id: 'C-elevator', x: 730, y: 65, width: 50, height: 50, label: 'C\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 755, y: 90 } },
  
  // 东段（从西到东）
  { id: 'FZ211', x: 790, y: 15, width: 45, height: 45, label: '211', corridor: 'north', pathNode: { x: 812, y: 95 } },
  { id: 'FZ212', x: 840, y: 15, width: 45, height: 45, label: '212', corridor: 'north', pathNode: { x: 862, y: 95 } },
  { id: 'FZ213', x: 890, y: 15, width: 45, height: 45, label: '213', corridor: 'north', pathNode: { x: 912, y: 95 } },
  { id: 'FZ214', x: 940, y: 15, width: 45, height: 45, label: '214', corridor: 'north', pathNode: { x: 962, y: 95 } },
  { id: 'FZ215', x: 990, y: 15, width: 45, height: 45, label: '215', corridor: 'north', pathNode: { x: 1012, y: 95 } },
  { id: 'FZ216', x: 1040, y: 15, width: 45, height: 45, label: '216', corridor: 'north', pathNode: { x: 1062, y: 95 } },
  { id: 'FZ217', x: 1090, y: 15, width: 45, height: 45, label: '217', corridor: 'north', pathNode: { x: 1112, y: 95 } },
  { id: 'FZ218', x: 1140, y: 15, width: 45, height: 45, label: '218', corridor: 'north', pathNode: { x: 1162, y: 95 } },
  { id: 'FZ219', x: 1190, y: 15, width: 45, height: 45, label: '219', corridor: 'north', pathNode: { x: 1212, y: 95 } },
  { id: 'FZ220', x: 1240, y: 15, width: 45, height: 45, label: '220', corridor: 'north', pathNode: { x: 1262, y: 95 } },
  { id: 'FZ221', x: 1290, y: 15, width: 45, height: 45, label: '221', corridor: 'north', pathNode: { x: 1312, y: 95 } },
  
  // 北侧楼梯（东侧）
  { id: 'stair-NE', x: 1340, y: 15, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  // ========== 东侧房间（走廊右侧）==========
  { id: 'FF208', x: 1350, y: 140, width: 45, height: 40, label: 'F208', corridor: 'east', pathNode: { x: 1325, y: 160 } },
  { id: 'FF207', x: 1350, y: 185, width: 45, height: 40, label: 'F207', corridor: 'east', pathNode: { x: 1325, y: 205 } },
  
  // 东侧楼梯
  { id: 'stair-E', x: 1350, y: 230, width: 45, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FF206', x: 1350, y: 290, width: 45, height: 40, label: 'F206', corridor: 'east', pathNode: { x: 1325, y: 310 } },
  { id: 'FF205', x: 1350, y: 335, width: 45, height: 40, label: 'F205', corridor: 'east', pathNode: { x: 1325, y: 355 } },
  { id: 'FF204', x: 1350, y: 380, width: 45, height: 40, label: 'F204', corridor: 'east', pathNode: { x: 1325, y: 400 } },
  { id: 'FF203', x: 1350, y: 425, width: 45, height: 40, label: 'F203', corridor: 'east', pathNode: { x: 1325, y: 445 } },
  { id: 'FF202', x: 1350, y: 470, width: 45, height: 40, label: 'F202', corridor: 'east', pathNode: { x: 1325, y: 490 } },
  { id: 'FF201', x: 1350, y: 515, width: 45, height: 40, label: 'F201', corridor: 'east', pathNode: { x: 1325, y: 535 } },
  
  // ========== 南侧房间（走廊下方）==========
  // 东段（从东到西）
  // D电梯（南侧东段，走廊内）
  { id: 'D-elevator', x: 730, y: 575, width: 50, height: 50, label: 'D\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 755, y: 560 } },
  
  { id: 'FZ222', x: 790, y: 600, width: 45, height: 45, label: '222', corridor: 'south', pathNode: { x: 812, y: 555 } },
  { id: 'FZ223', x: 840, y: 600, width: 45, height: 45, label: '223', corridor: 'south', pathNode: { x: 862, y: 555 } },
  { id: 'FZ224', x: 890, y: 600, width: 45, height: 45, label: '224', corridor: 'south', pathNode: { x: 912, y: 555 } },
  { id: 'FZ225', x: 940, y: 600, width: 45, height: 45, label: '225', corridor: 'south', pathNode: { x: 962, y: 555 } },
  { id: 'FZ226', x: 990, y: 600, width: 45, height: 45, label: '226', corridor: 'south', pathNode: { x: 1012, y: 555 } },
  { id: 'FZ227', x: 1040, y: 600, width: 45, height: 45, label: '227', corridor: 'south', pathNode: { x: 1062, y: 555 } },
  { id: 'FZ228', x: 1090, y: 600, width: 45, height: 45, label: '228', corridor: 'south', pathNode: { x: 1112, y: 555 } },
  { id: 'FZ229', x: 1140, y: 600, width: 45, height: 45, label: '229', corridor: 'south', pathNode: { x: 1162, y: 555 } },
  { id: 'FZ230', x: 1190, y: 600, width: 45, height: 45, label: '230', corridor: 'south', pathNode: { x: 1212, y: 555 } },
  { id: 'FZ231', x: 1240, y: 600, width: 45, height: 45, label: '231', corridor: 'south', pathNode: { x: 1262, y: 555 } },
  
  // 南侧楼梯（东侧）
  { id: 'stair-SE', x: 1290, y: 600, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  // ========== 断开区域 ==========
  
  // B电梯（南侧西段，走廊内）
  { id: 'B-elevator', x: 615, y: 575, width: 50, height: 50, label: 'B\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 640, y: 560 } },
  
  // 西段（从东到西）
  { id: 'FZ232', x: 560, y: 600, width: 45, height: 45, label: '232', corridor: 'south', pathNode: { x: 582, y: 555 } },
  { id: 'FZ233', x: 510, y: 600, width: 45, height: 45, label: '233', corridor: 'south', pathNode: { x: 532, y: 555 } },
  { id: 'FZ234', x: 460, y: 600, width: 45, height: 45, label: '234', corridor: 'south', pathNode: { x: 482, y: 555 } },
  { id: 'FZ235', x: 410, y: 600, width: 45, height: 45, label: '235', corridor: 'south', pathNode: { x: 432, y: 555 } },
  { id: 'FZ236', x: 360, y: 600, width: 45, height: 45, label: '236', corridor: 'south', pathNode: { x: 382, y: 555 } },
  { id: 'FZ237', x: 310, y: 600, width: 45, height: 45, label: '237', corridor: 'south', pathNode: { x: 332, y: 555 } },
  { id: 'FZ238', x: 260, y: 600, width: 45, height: 45, label: '238', corridor: 'south', pathNode: { x: 282, y: 555 } },
  { id: 'FZ239', x: 210, y: 600, width: 45, height: 45, label: '239', corridor: 'south', pathNode: { x: 232, y: 555 } },
  
  // 南侧楼梯（西侧）
  { id: 'stair-SW', x: 155, y: 600, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  { id: 'FZ240', x: 100, y: 600, width: 50, height: 45, label: '240', corridor: 'south', pathNode: { x: 125, y: 555 } },
  { id: 'FZ241', x: 45, y: 600, width: 50, height: 45, label: '241', corridor: 'south', pathNode: { x: 70, y: 555 } },
  
  // ========== 西侧房间 ==========
  { id: 'FZ242', x: 45, y: 500, width: 50, height: 45, label: '242', corridor: 'west', pathNode: { x: 70, y: 522 } },
  
  // ========== 中心区域：逸夫报告厅 ==========
  { id: 'auditorium', x: 200, y: 150, width: 400, height: 320, label: '逸夫报告厅', type: 'feature', corridor: 'center', pathNode: { x: 400, y: 310 } },
];

// ==================== 三楼平面图 ====================
// 与二楼类似的U型布局，但东侧走廊中间断开
// 注意：南北走廊在电梯A-C、B-D之间断开，东侧走廊也断开
const floor3Rooms: RoomData[] = [
  // ========== 北侧西段房间（从西到东）==========
  { id: 'FZ301', x: 20, y: 20, width: 55, height: 50, label: '301', corridor: 'north-west', pathNode: { x: 47, y: 75 } },
  { id: 'FZ302', x: 85, y: 20, width: 55, height: 50, label: '302', corridor: 'north-west', pathNode: { x: 112, y: 75 } },
  { id: 'FZ303', x: 150, y: 20, width: 55, height: 50, label: '303', corridor: 'north-west', pathNode: { x: 177, y: 75 } },
  
  // 北部楼梯（西侧）
  { id: 'stair-NW', x: 215, y: 20, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ304', x: 280, y: 20, width: 48, height: 50, label: '304', corridor: 'north-west', pathNode: { x: 304, y: 75 } },
  { id: 'FZ305', x: 338, y: 20, width: 48, height: 50, label: '305', corridor: 'north-west', pathNode: { x: 362, y: 75 } },
  { id: 'FZ306', x: 396, y: 20, width: 48, height: 50, label: '306', corridor: 'north-west', pathNode: { x: 420, y: 75 } },
  { id: 'FZ307', x: 454, y: 20, width: 48, height: 50, label: '307', corridor: 'north-west', pathNode: { x: 478, y: 75 } },
  { id: 'FZ308', x: 512, y: 20, width: 48, height: 50, label: '308', corridor: 'north-west', pathNode: { x: 536, y: 75 } },
  { id: 'FZ309', x: 570, y: 20, width: 48, height: 50, label: '309', corridor: 'north-west', pathNode: { x: 594, y: 75 } },
  { id: 'FZ310', x: 628, y: 20, width: 48, height: 50, label: '310', corridor: 'north-west', pathNode: { x: 652, y: 75 } },
  { id: 'FZ311', x: 686, y: 20, width: 48, height: 50, label: '311', corridor: 'north-west', pathNode: { x: 710, y: 75 } },
  
  // A电梯（北侧西段最东）
  { id: 'A-elevator', x: 744, y: 15, width: 60, height: 55, label: 'A\n电梯', type: 'elevator', corridor: 'north-west', pathNode: { x: 774, y: 75 } },
  
  // ========== 北侧东段房间（从西到东）==========
  // C电梯（北侧东段最西）
  { id: 'C-elevator', x: 868, y: 15, width: 60, height: 55, label: 'C\n电梯', type: 'elevator', corridor: 'north-east', pathNode: { x: 898, y: 75 } },
  
  { id: 'FZ312', x: 938, y: 20, width: 48, height: 50, label: '312', corridor: 'north-east', pathNode: { x: 962, y: 75 } },
  { id: 'FZ313', x: 996, y: 20, width: 48, height: 50, label: '313', corridor: 'north-east', pathNode: { x: 1020, y: 75 } },
  { id: 'FZ314', x: 1054, y: 20, width: 48, height: 50, label: '314', corridor: 'north-east', pathNode: { x: 1078, y: 75 } },
  { id: 'FZ315', x: 1112, y: 20, width: 48, height: 50, label: '315', corridor: 'north-east', pathNode: { x: 1136, y: 75 } },
  { id: 'FZ316', x: 1170, y: 20, width: 48, height: 50, label: '316', corridor: 'north-east', pathNode: { x: 1194, y: 75 } },
  { id: 'FZ317', x: 1228, y: 20, width: 48, height: 50, label: '317', corridor: 'north-east', pathNode: { x: 1252, y: 75 } },
  { id: 'FZ318', x: 1286, y: 20, width: 48, height: 50, label: '318', corridor: 'north-east', pathNode: { x: 1310, y: 75 } },
  { id: 'FZ319', x: 1344, y: 20, width: 48, height: 50, label: '319', corridor: 'north-east', pathNode: { x: 1368, y: 75 } },
  { id: 'FZ320', x: 1402, y: 20, width: 48, height: 50, label: '320', corridor: 'north-east', pathNode: { x: 1426, y: 75 } },
  { id: 'FZ321', x: 1460, y: 20, width: 48, height: 50, label: '321', corridor: 'north-east', pathNode: { x: 1484, y: 75 } },
  { id: 'FZ322', x: 1518, y: 20, width: 48, height: 50, label: '322', corridor: 'north-east', pathNode: { x: 1542, y: 75 } },
  
  // 北部楼梯（东侧）
  { id: 'stair-NE', x: 1576, y: 20, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊北段房间（从北到南）==========
  { id: 'FF308', x: 1576, y: 100, width: 55, height: 45, label: 'F308', corridor: 'east-north', pathNode: { x: 1568, y: 122 } },
  { id: 'FF307', x: 1576, y: 155, width: 55, height: 45, label: 'F307', corridor: 'east-north', pathNode: { x: 1568, y: 177 } },
  
  // 东部楼梯（北段）
  { id: 'stair-E-N', x: 1576, y: 210, width: 55, height: 55, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊断开区域 ==========
  
  // ========== 东侧走廊南段房间（从北到南）==========
  // 东部楼梯（南段）
  { id: 'stair-E-S', x: 1576, y: 340, width: 55, height: 55, label: '楼梯', type: 'stair' },
  
  { id: 'FF306', x: 1576, y: 405, width: 55, height: 45, label: 'F306', corridor: 'east-south', pathNode: { x: 1568, y: 427 } },
  { id: 'FF305', x: 1576, y: 460, width: 55, height: 45, label: 'F305', corridor: 'east-south', pathNode: { x: 1568, y: 482 } },
  { id: 'FF304', x: 1576, y: 515, width: 55, height: 45, label: 'F304', corridor: 'east-south', pathNode: { x: 1568, y: 537 } },
  { id: 'FF303', x: 1576, y: 570, width: 55, height: 45, label: 'F303', corridor: 'east-south', pathNode: { x: 1568, y: 592 } },
  { id: 'FF302', x: 1576, y: 625, width: 55, height: 45, label: 'F302', corridor: 'east-south', pathNode: { x: 1568, y: 647 } },
  { id: 'FF301', x: 1576, y: 680, width: 55, height: 45, label: 'F301', corridor: 'east-south', pathNode: { x: 1568, y: 702 } },
  
  // ========== 南侧东段房间（从西到东）==========
  // D电梯（南侧东段最西）
  { id: 'D-elevator', x: 868, y: 735, width: 60, height: 55, label: 'D\n电梯', type: 'elevator', corridor: 'south-east', pathNode: { x: 898, y: 730 } },
  
  { id: 'FZ323', x: 938, y: 740, width: 48, height: 50, label: '323', corridor: 'south-east', pathNode: { x: 962, y: 730 } },
  { id: 'FZ324', x: 996, y: 740, width: 48, height: 50, label: '324', corridor: 'south-east', pathNode: { x: 1020, y: 730 } },
  { id: 'FZ325', x: 1054, y: 740, width: 48, height: 50, label: '325', corridor: 'south-east', pathNode: { x: 1078, y: 730 } },
  { id: 'FZ326', x: 1112, y: 740, width: 48, height: 50, label: '326', corridor: 'south-east', pathNode: { x: 1136, y: 730 } },
  { id: 'FZ327', x: 1170, y: 740, width: 48, height: 50, label: '327', corridor: 'south-east', pathNode: { x: 1194, y: 730 } },
  { id: 'FZ328', x: 1228, y: 740, width: 48, height: 50, label: '328', corridor: 'south-east', pathNode: { x: 1252, y: 730 } },
  { id: 'FZ329', x: 1286, y: 740, width: 48, height: 50, label: '329', corridor: 'south-east', pathNode: { x: 1310, y: 730 } },
  { id: 'FZ330', x: 1344, y: 740, width: 48, height: 50, label: '330', corridor: 'south-east', pathNode: { x: 1368, y: 730 } },
  { id: 'FZ331', x: 1402, y: 740, width: 48, height: 50, label: '331', corridor: 'south-east', pathNode: { x: 1426, y: 730 } },
  { id: 'FZ332', x: 1460, y: 740, width: 48, height: 50, label: '332', corridor: 'south-east', pathNode: { x: 1484, y: 730 } },
  { id: 'FZ333', x: 1518, y: 740, width: 48, height: 50, label: '333', corridor: 'south-east', pathNode: { x: 1542, y: 730 } },
  
  // 南部楼梯（东侧）
  { id: 'stair-SE', x: 1576, y: 740, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 南侧西段房间（从西到东）==========
  // B电梯（南侧西段最东）
  { id: 'B-elevator', x: 744, y: 735, width: 60, height: 55, label: 'B\n电梯', type: 'elevator', corridor: 'south-west', pathNode: { x: 774, y: 730 } },
  
  { id: 'FZ334', x: 686, y: 740, width: 48, height: 50, label: '334', corridor: 'south-west', pathNode: { x: 710, y: 730 } },
  { id: 'FZ335', x: 628, y: 740, width: 48, height: 50, label: '335', corridor: 'south-west', pathNode: { x: 652, y: 730 } },
  { id: 'FZ336', x: 570, y: 740, width: 48, height: 50, label: '336', corridor: 'south-west', pathNode: { x: 594, y: 730 } },
  { id: 'FZ337', x: 512, y: 740, width: 48, height: 50, label: '337', corridor: 'south-west', pathNode: { x: 536, y: 730 } },
  { id: 'FZ338', x: 454, y: 740, width: 48, height: 50, label: '338', corridor: 'south-west', pathNode: { x: 478, y: 730 } },
  { id: 'FZ339', x: 396, y: 740, width: 48, height: 50, label: '339', corridor: 'south-west', pathNode: { x: 420, y: 730 } },
  
  // 南部楼梯（西侧）
  { id: 'stair-SW', x: 215, y: 740, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ340', x: 150, y: 740, width: 55, height: 50, label: '340', corridor: 'south-west', pathNode: { x: 177, y: 730 } },
  { id: 'FZ341', x: 85, y: 740, width: 55, height: 50, label: '341', corridor: 'south-west', pathNode: { x: 112, y: 730 } },
  { id: 'FZ342', x: 20, y: 740, width: 55, height: 50, label: '342', corridor: 'south-west', pathNode: { x: 47, y: 730 } },
  { id: 'FZ343', x: 20, y: 680, width: 55, height: 50, label: '343', corridor: 'west', pathNode: { x: 47, y: 705 } },
  { id: 'FZ344', x: 20, y: 620, width: 55, height: 50, label: '344', corridor: 'west', pathNode: { x: 47, y: 645 } },
  
  // ========== 中心区域 ==========
  { id: 'center-area', x: 280, y: 130, width: 440, height: 580, label: '中心区域', type: 'feature', corridor: 'center', pathNode: { x: 500, y: 420 } },
];

// ==================== 四楼平面图 ====================
// 与二楼相同的U型布局，东侧走廊贯通
// 注意：南北走廊在电梯A-C、B-D之间断开
const floor4Rooms: RoomData[] = [
  // ========== 北侧西段房间（从西到东）==========
  { id: 'FZ401', x: 20, y: 20, width: 55, height: 50, label: '401', corridor: 'north-west', pathNode: { x: 47, y: 75 } },
  { id: 'FZ402', x: 85, y: 20, width: 55, height: 50, label: '402', corridor: 'north-west', pathNode: { x: 112, y: 75 } },
  { id: 'FZ403', x: 150, y: 20, width: 55, height: 50, label: '403', corridor: 'north-west', pathNode: { x: 177, y: 75 } },
  
  // 北部楼梯（西侧）
  { id: 'stair-NW', x: 215, y: 20, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ404', x: 280, y: 20, width: 48, height: 50, label: '404', corridor: 'north-west', pathNode: { x: 304, y: 75 } },
  { id: 'FZ405', x: 338, y: 20, width: 48, height: 50, label: '405', corridor: 'north-west', pathNode: { x: 362, y: 75 } },
  { id: 'FZ406', x: 396, y: 20, width: 48, height: 50, label: '406', corridor: 'north-west', pathNode: { x: 420, y: 75 } },
  { id: 'FZ407', x: 454, y: 20, width: 48, height: 50, label: '407', corridor: 'north-west', pathNode: { x: 478, y: 75 } },
  { id: 'FZ408', x: 512, y: 20, width: 48, height: 50, label: '408', corridor: 'north-west', pathNode: { x: 536, y: 75 } },
  { id: 'FZ409', x: 570, y: 20, width: 48, height: 50, label: '409', corridor: 'north-west', pathNode: { x: 594, y: 75 } },
  { id: 'FZ410', x: 628, y: 20, width: 48, height: 50, label: '410', corridor: 'north-west', pathNode: { x: 652, y: 75 } },
  
  // A电梯（北侧西段最东）
  { id: 'A-elevator', x: 686, y: 15, width: 60, height: 55, label: 'A\n电梯', type: 'elevator', corridor: 'north-west', pathNode: { x: 716, y: 75 } },
  
  // ========== 北侧东段房间（从西到东）==========
  // C电梯（北侧东段最西）
  { id: 'C-elevator', x: 810, y: 15, width: 60, height: 55, label: 'C\n电梯', type: 'elevator', corridor: 'north-east', pathNode: { x: 840, y: 75 } },
  
  { id: 'FZ411', x: 880, y: 20, width: 48, height: 50, label: '411', corridor: 'north-east', pathNode: { x: 904, y: 75 } },
  { id: 'FZ412', x: 938, y: 20, width: 48, height: 50, label: '412', corridor: 'north-east', pathNode: { x: 962, y: 75 } },
  { id: 'FZ413', x: 996, y: 20, width: 48, height: 50, label: '413', corridor: 'north-east', pathNode: { x: 1020, y: 75 } },
  { id: 'FZ414', x: 1054, y: 20, width: 48, height: 50, label: '414', corridor: 'north-east', pathNode: { x: 1078, y: 75 } },
  { id: 'FZ415', x: 1112, y: 20, width: 48, height: 50, label: '415', corridor: 'north-east', pathNode: { x: 1136, y: 75 } },
  { id: 'FZ416', x: 1170, y: 20, width: 48, height: 50, label: '416', corridor: 'north-east', pathNode: { x: 1194, y: 75 } },
  { id: 'FZ417', x: 1228, y: 20, width: 48, height: 50, label: '417', corridor: 'north-east', pathNode: { x: 1252, y: 75 } },
  { id: 'FZ418', x: 1286, y: 20, width: 48, height: 50, label: '418', corridor: 'north-east', pathNode: { x: 1310, y: 75 } },
  { id: 'FZ419', x: 1344, y: 20, width: 48, height: 50, label: '419', corridor: 'north-east', pathNode: { x: 1368, y: 75 } },
  { id: 'FZ420', x: 1402, y: 20, width: 48, height: 50, label: '420', corridor: 'north-east', pathNode: { x: 1426, y: 75 } },
  { id: 'FZ421', x: 1460, y: 20, width: 48, height: 50, label: '421', corridor: 'north-east', pathNode: { x: 1484, y: 75 } },
  { id: 'FZ422', x: 1518, y: 20, width: 48, height: 50, label: '422', corridor: 'north-east', pathNode: { x: 1542, y: 75 } },
  
  // 北部楼梯（东侧）
  { id: 'stair-NE', x: 1576, y: 20, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊房间（从北到南）==========
  { id: 'FF408', x: 1576, y: 100, width: 55, height: 45, label: 'F408', corridor: 'east', pathNode: { x: 1568, y: 122 } },
  { id: 'FF407', x: 1576, y: 155, width: 55, height: 45, label: 'F407', corridor: 'east', pathNode: { x: 1568, y: 177 } },
  
  // 东部楼梯
  { id: 'stair-E', x: 1576, y: 210, width: 55, height: 55, label: '楼梯', type: 'stair' },
  
  { id: 'FF406', x: 1576, y: 275, width: 55, height: 45, label: 'F406', corridor: 'east', pathNode: { x: 1568, y: 297 } },
  { id: 'FF405', x: 1576, y: 330, width: 55, height: 45, label: 'F405', corridor: 'east', pathNode: { x: 1568, y: 352 } },
  { id: 'FF404', x: 1576, y: 385, width: 55, height: 45, label: 'F404', corridor: 'east', pathNode: { x: 1568, y: 407 } },
  { id: 'FF403', x: 1576, y: 440, width: 55, height: 45, label: 'F403', corridor: 'east', pathNode: { x: 1568, y: 462 } },
  { id: 'FF402', x: 1576, y: 495, width: 55, height: 45, label: 'F402', corridor: 'east', pathNode: { x: 1568, y: 517 } },
  { id: 'FF401', x: 1576, y: 550, width: 55, height: 45, label: 'F401', corridor: 'east', pathNode: { x: 1568, y: 572 } },
  
  // ========== 南侧东段房间（从西到东）==========
  // D电梯（南侧东段最西）
  { id: 'D-elevator', x: 810, y: 605, width: 60, height: 55, label: 'D\n电梯', type: 'elevator', corridor: 'south-east', pathNode: { x: 840, y: 600 } },
  
  { id: 'FZ423', x: 880, y: 610, width: 48, height: 50, label: '423', corridor: 'south-east', pathNode: { x: 904, y: 600 } },
  { id: 'FZ424', x: 938, y: 610, width: 48, height: 50, label: '424', corridor: 'south-east', pathNode: { x: 962, y: 600 } },
  { id: 'FZ425', x: 996, y: 610, width: 48, height: 50, label: '425', corridor: 'south-east', pathNode: { x: 1020, y: 600 } },
  { id: 'FZ426', x: 1054, y: 610, width: 48, height: 50, label: '426', corridor: 'south-east', pathNode: { x: 1078, y: 600 } },
  { id: 'FZ427', x: 1112, y: 610, width: 48, height: 50, label: '427', corridor: 'south-east', pathNode: { x: 1136, y: 600 } },
  { id: 'FZ428', x: 1170, y: 610, width: 48, height: 50, label: '428', corridor: 'south-east', pathNode: { x: 1194, y: 600 } },
  { id: 'FZ429', x: 1228, y: 610, width: 48, height: 50, label: '429', corridor: 'south-east', pathNode: { x: 1252, y: 600 } },
  { id: 'FZ430', x: 1286, y: 610, width: 48, height: 50, label: '430', corridor: 'south-east', pathNode: { x: 1310, y: 600 } },
  { id: 'FZ431', x: 1344, y: 610, width: 48, height: 50, label: '431', corridor: 'south-east', pathNode: { x: 1368, y: 600 } },
  { id: 'FZ432', x: 1402, y: 610, width: 48, height: 50, label: '432', corridor: 'south-east', pathNode: { x: 1426, y: 600 } },
  { id: 'FZ433', x: 1460, y: 610, width: 48, height: 50, label: '433', corridor: 'south-east', pathNode: { x: 1484, y: 600 } },
  
  // 南部楼梯（东侧）
  { id: 'stair-SE', x: 1518, y: 610, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 南侧西段房间（从西到东）==========
  // B电梯（南侧西段最东）
  { id: 'B-elevator', x: 686, y: 605, width: 60, height: 55, label: 'B\n电梯', type: 'elevator', corridor: 'south-west', pathNode: { x: 716, y: 600 } },
  
  { id: 'FZ434', x: 628, y: 610, width: 48, height: 50, label: '434', corridor: 'south-west', pathNode: { x: 652, y: 600 } },
  { id: 'FZ435', x: 570, y: 610, width: 48, height: 50, label: '435', corridor: 'south-west', pathNode: { x: 594, y: 600 } },
  { id: 'FZ436', x: 512, y: 610, width: 48, height: 50, label: '436', corridor: 'south-west', pathNode: { x: 536, y: 600 } },
  { id: 'FZ437', x: 454, y: 610, width: 48, height: 50, label: '437', corridor: 'south-west', pathNode: { x: 478, y: 600 } },
  { id: 'FZ438', x: 396, y: 610, width: 48, height: 50, label: '438', corridor: 'south-west', pathNode: { x: 420, y: 600 } },
  { id: 'FZ439', x: 338, y: 610, width: 48, height: 50, label: '439', corridor: 'south-west', pathNode: { x: 362, y: 600 } },
  
  // 南部楼梯（西侧）
  { id: 'stair-SW', x: 150, y: 610, width: 55, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ440', x: 85, y: 610, width: 55, height: 50, label: '440', corridor: 'south-west', pathNode: { x: 112, y: 600 } },
  { id: 'FZ441', x: 20, y: 610, width: 55, height: 50, label: '441', corridor: 'south-west', pathNode: { x: 47, y: 600 } },
  { id: 'FZ442', x: 20, y: 550, width: 55, height: 50, label: '442', corridor: 'west', pathNode: { x: 47, y: 575 } },
  { id: 'FZ443', x: 20, y: 490, width: 55, height: 50, label: '443', corridor: 'west', pathNode: { x: 47, y: 515 } },
  { id: 'FZ444', x: 20, y: 430, width: 55, height: 50, label: '444', corridor: 'west', pathNode: { x: 47, y: 455 } },
  
  // ========== 中心区域：逸夫报告厅 ==========
  { id: 'auditorium', x: 230, y: 130, width: 450, height: 420, label: '逸夫报告厅', type: 'feature', corridor: 'center', pathNode: { x: 455, y: 340 } },
];

// ==================== 五楼平面图 ====================
// 四走廊围绕布局，全部贯通
const floor5Rooms: RoomData[] = [
  // ========== 西侧走廊房间（从北到南）==========
  { id: 'FZ501', x: 20, y: 80, width: 50, height: 45, label: '501', corridor: 'west', pathNode: { x: 75, y: 102 } },
  { id: 'FZ502', x: 20, y: 135, width: 50, height: 45, label: '502', corridor: 'west', pathNode: { x: 75, y: 157 } },
  { id: 'FZ503', x: 20, y: 190, width: 50, height: 45, label: '503', corridor: 'west', pathNode: { x: 75, y: 212 } },
  { id: 'FZ504', x: 20, y: 245, width: 50, height: 45, label: '504', corridor: 'west', pathNode: { x: 75, y: 267 } },
  { id: 'FZ505', x: 20, y: 300, width: 50, height: 45, label: '505', corridor: 'west', pathNode: { x: 75, y: 322 } },
  
  // 西侧楼梯
  { id: 'stair-W', x: 20, y: 355, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ558', x: 20, y: 415, width: 50, height: 45, label: '558', corridor: 'west', pathNode: { x: 75, y: 437 } },
  { id: 'FZ559', x: 20, y: 470, width: 50, height: 45, label: '559', corridor: 'west', pathNode: { x: 75, y: 492 } },
  
  // ========== 北侧走廊房间（从西到东）==========
  { id: 'stair-NW', x: 80, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ506', x: 140, y: 20, width: 45, height: 50, label: '506', corridor: 'north', pathNode: { x: 162, y: 75 } },
  { id: 'FZ507', x: 195, y: 20, width: 45, height: 50, label: '507', corridor: 'north', pathNode: { x: 217, y: 75 } },
  { id: 'FZ508', x: 250, y: 20, width: 45, height: 50, label: '508', corridor: 'north', pathNode: { x: 272, y: 75 } },
  { id: 'FZ509', x: 305, y: 20, width: 45, height: 50, label: '509', corridor: 'north', pathNode: { x: 327, y: 75 } },
  { id: 'FZ510', x: 360, y: 20, width: 45, height: 50, label: '510', corridor: 'north', pathNode: { x: 382, y: 75 } },
  { id: 'FZ511', x: 415, y: 20, width: 45, height: 50, label: '511', corridor: 'north', pathNode: { x: 437, y: 75 } },
  { id: 'FZ512', x: 470, y: 20, width: 45, height: 50, label: '512', corridor: 'north', pathNode: { x: 492, y: 75 } },
  { id: 'FZ513', x: 525, y: 20, width: 45, height: 50, label: '513', corridor: 'north', pathNode: { x: 547, y: 75 } },
  
  // A电梯（北侧中偏西）
  { id: 'A-elevator', x: 580, y: 15, width: 55, height: 55, label: 'A\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 607, y: 75 } },
  
  { id: 'FZ514', x: 645, y: 20, width: 45, height: 50, label: '514', corridor: 'north', pathNode: { x: 667, y: 75 } },
  { id: 'FZ515', x: 700, y: 20, width: 45, height: 50, label: '515', corridor: 'north', pathNode: { x: 722, y: 75 } },
  { id: 'FZ516', x: 755, y: 20, width: 45, height: 50, label: '516', corridor: 'north', pathNode: { x: 777, y: 75 } },
  { id: 'FZ517', x: 810, y: 20, width: 45, height: 50, label: '517', corridor: 'north', pathNode: { x: 832, y: 75 } },
  
  // C电梯（北侧中偏东）
  { id: 'C-elevator', x: 865, y: 15, width: 55, height: 55, label: 'C\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 892, y: 75 } },
  
  { id: 'FZ518', x: 930, y: 20, width: 45, height: 50, label: '518', corridor: 'north', pathNode: { x: 952, y: 75 } },
  { id: 'FZ519', x: 985, y: 20, width: 45, height: 50, label: '519', corridor: 'north', pathNode: { x: 1007, y: 75 } },
  { id: 'FZ520', x: 1040, y: 20, width: 45, height: 50, label: '520', corridor: 'north', pathNode: { x: 1062, y: 75 } },
  { id: 'FZ521', x: 1095, y: 20, width: 45, height: 50, label: '521', corridor: 'north', pathNode: { x: 1117, y: 75 } },
  { id: 'FZ522', x: 1150, y: 20, width: 45, height: 50, label: '522', corridor: 'north', pathNode: { x: 1172, y: 75 } },
  { id: 'FZ523', x: 1205, y: 20, width: 45, height: 50, label: '523', corridor: 'north', pathNode: { x: 1227, y: 75 } },
  { id: 'FZ524', x: 1260, y: 20, width: 45, height: 50, label: '524', corridor: 'north', pathNode: { x: 1282, y: 75 } },
  { id: 'FZ525', x: 1315, y: 20, width: 45, height: 50, label: '525', corridor: 'north', pathNode: { x: 1337, y: 75 } },
  { id: 'FZ526', x: 1370, y: 20, width: 45, height: 50, label: '526', corridor: 'north', pathNode: { x: 1392, y: 75 } },
  { id: 'FZ527', x: 1425, y: 20, width: 45, height: 50, label: '527', corridor: 'north', pathNode: { x: 1447, y: 75 } },
  { id: 'FZ528', x: 1480, y: 20, width: 45, height: 50, label: '528', corridor: 'north', pathNode: { x: 1502, y: 75 } },
  
  // 北侧东段楼梯
  { id: 'stair-NE', x: 1535, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊房间（从北到南）==========
  { id: 'FF511', x: 1535, y: 80, width: 50, height: 45, label: 'F511', corridor: 'east', pathNode: { x: 1527, y: 102 } },
  { id: 'FF510', x: 1535, y: 135, width: 50, height: 45, label: 'F510', corridor: 'east', pathNode: { x: 1527, y: 157 } },
  { id: 'FF509', x: 1535, y: 190, width: 50, height: 45, label: 'F509', corridor: 'east', pathNode: { x: 1527, y: 212 } },
  { id: 'FF508', x: 1535, y: 245, width: 50, height: 45, label: 'F508', corridor: 'east', pathNode: { x: 1527, y: 267 } },
  { id: 'FF507', x: 1535, y: 300, width: 50, height: 45, label: 'F507', corridor: 'east', pathNode: { x: 1527, y: 322 } },
  { id: 'FF506', x: 1535, y: 355, width: 50, height: 45, label: 'F506', corridor: 'east', pathNode: { x: 1527, y: 377 } },
  
  // 东侧楼梯
  { id: 'stair-E', x: 1535, y: 410, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FF505', x: 1535, y: 470, width: 50, height: 45, label: 'F505', corridor: 'east', pathNode: { x: 1527, y: 492 } },
  { id: 'FF504', x: 1535, y: 525, width: 50, height: 45, label: 'F504', corridor: 'east', pathNode: { x: 1527, y: 547 } },
  { id: 'FF503', x: 1535, y: 580, width: 50, height: 45, label: 'F503', corridor: 'east', pathNode: { x: 1527, y: 602 } },
  { id: 'FF502', x: 1535, y: 635, width: 50, height: 45, label: 'F502', corridor: 'east', pathNode: { x: 1527, y: 657 } },
  { id: 'FF501', x: 1535, y: 690, width: 50, height: 45, label: 'F501', corridor: 'east', pathNode: { x: 1527, y: 712 } },
  
  // ========== 南侧走廊房间（从西到东）==========
  { id: 'FZ555', x: 80, y: 740, width: 50, height: 50, label: '555', corridor: 'south', pathNode: { x: 105, y: 735 } },
  { id: 'FZ556', x: 140, y: 740, width: 50, height: 50, label: '556', corridor: 'south', pathNode: { x: 165, y: 735 } },
  { id: 'FZ557', x: 200, y: 740, width: 50, height: 50, label: '557', corridor: 'south', pathNode: { x: 225, y: 735 } },
  
  // 南侧西段楼梯
  { id: 'stair-SW', x: 260, y: 740, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ544', x: 320, y: 740, width: 45, height: 50, label: '544', corridor: 'south', pathNode: { x: 342, y: 735 } },
  { id: 'FZ545', x: 375, y: 740, width: 45, height: 50, label: '545', corridor: 'south', pathNode: { x: 397, y: 735 } },
  { id: 'FZ546', x: 430, y: 740, width: 45, height: 50, label: '546', corridor: 'south', pathNode: { x: 452, y: 735 } },
  { id: 'FZ547', x: 485, y: 740, width: 45, height: 50, label: '547', corridor: 'south', pathNode: { x: 507, y: 735 } },
  { id: 'FZ548', x: 540, y: 740, width: 45, height: 50, label: '548', corridor: 'south', pathNode: { x: 562, y: 735 } },
  { id: 'FZ549', x: 595, y: 740, width: 45, height: 50, label: '549', corridor: 'south', pathNode: { x: 617, y: 735 } },
  { id: 'FZ550', x: 650, y: 740, width: 45, height: 50, label: '550', corridor: 'south', pathNode: { x: 672, y: 735 } },
  { id: 'FZ551', x: 705, y: 740, width: 45, height: 50, label: '551', corridor: 'south', pathNode: { x: 727, y: 735 } },
  { id: 'FZ552', x: 760, y: 740, width: 45, height: 50, label: '552', corridor: 'south', pathNode: { x: 782, y: 735 } },
  { id: 'FZ553', x: 815, y: 740, width: 45, height: 50, label: '553', corridor: 'south', pathNode: { x: 837, y: 735 } },
  
  // B电梯（南侧中偏西）
  { id: 'B-elevator', x: 870, y: 735, width: 55, height: 55, label: 'B\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 897, y: 735 } },
  
  { id: 'FZ529', x: 935, y: 740, width: 45, height: 50, label: '529', corridor: 'south', pathNode: { x: 957, y: 735 } },
  { id: 'FZ530', x: 990, y: 740, width: 45, height: 50, label: '530', corridor: 'south', pathNode: { x: 1012, y: 735 } },
  { id: 'FZ531', x: 1045, y: 740, width: 45, height: 50, label: '531', corridor: 'south', pathNode: { x: 1067, y: 735 } },
  { id: 'FZ532', x: 1100, y: 740, width: 45, height: 50, label: '532', corridor: 'south', pathNode: { x: 1122, y: 735 } },
  { id: 'FZ533', x: 1155, y: 740, width: 45, height: 50, label: '533', corridor: 'south', pathNode: { x: 1177, y: 735 } },
  { id: 'FZ534', x: 1210, y: 740, width: 45, height: 50, label: '534', corridor: 'south', pathNode: { x: 1232, y: 735 } },
  { id: 'FZ535', x: 1265, y: 740, width: 45, height: 50, label: '535', corridor: 'south', pathNode: { x: 1287, y: 735 } },
  { id: 'FZ536', x: 1320, y: 740, width: 45, height: 50, label: '536', corridor: 'south', pathNode: { x: 1342, y: 735 } },
  { id: 'FZ537', x: 1375, y: 740, width: 45, height: 50, label: '537', corridor: 'south', pathNode: { x: 1397, y: 735 } },
  { id: 'FZ538', x: 1430, y: 740, width: 45, height: 50, label: '538', corridor: 'south', pathNode: { x: 1452, y: 735 } },
  { id: 'FZ539', x: 1485, y: 740, width: 45, height: 50, label: '539', corridor: 'south', pathNode: { x: 1507, y: 735 } },
  
  // D电梯（南侧中偏东）
  { id: 'D-elevator', x: 1540, y: 735, width: 55, height: 55, label: 'D\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 1567, y: 735 } },
  
  // ========== 中心区域 ==========
  { id: 'center-area', x: 80, y: 80, width: 1450, height: 650, label: '中心区域', type: 'feature', corridor: 'center', pathNode: { x: 805, y: 405 } },
];

// ==================== 六楼平面图 ====================
// 四走廊围绕布局，走廊之间不连通
const floor6Rooms: RoomData[] = [
  // ========== 西侧走廊房间（从北到南）==========
  { id: 'FZ601', x: 20, y: 80, width: 50, height: 50, label: '601', corridor: 'west', pathNode: { x: 75, y: 105 } },
  { id: 'FZ602', x: 20, y: 140, width: 50, height: 50, label: '602', corridor: 'west', pathNode: { x: 75, y: 165 } },
  
  // 西侧楼梯
  { id: 'stair-WN', x: 20, y: 200, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ660', x: 20, y: 260, width: 50, height: 50, label: '660', corridor: 'west', pathNode: { x: 75, y: 285 } },
  { id: 'FZ661', x: 20, y: 320, width: 50, height: 50, label: '661', corridor: 'west', pathNode: { x: 75, y: 345 } },
  { id: 'FZ662', x: 20, y: 380, width: 50, height: 50, label: '662', corridor: 'west', pathNode: { x: 75, y: 405 } },
  
  // 西侧楼梯
  { id: 'stair-WS', x: 20, y: 440, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ658', x: 20, y: 500, width: 50, height: 50, label: '658', corridor: 'west', pathNode: { x: 75, y: 525 } },
  { id: 'FZ659', x: 20, y: 560, width: 50, height: 50, label: '659', corridor: 'west', pathNode: { x: 75, y: 585 } },
  
  // ========== 北侧走廊房间（从西到东）==========
  { id: 'stair-NW', x: 80, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ603', x: 140, y: 20, width: 48, height: 50, label: '603', corridor: 'north', pathNode: { x: 164, y: 75 } },
  { id: 'FZ604', x: 198, y: 20, width: 48, height: 50, label: '604', corridor: 'north', pathNode: { x: 222, y: 75 } },
  { id: 'FZ605', x: 256, y: 20, width: 48, height: 50, label: '605', corridor: 'north', pathNode: { x: 280, y: 75 } },
  { id: 'FZ606', x: 314, y: 20, width: 48, height: 50, label: '606', corridor: 'north', pathNode: { x: 338, y: 75 } },
  { id: 'FZ607', x: 372, y: 20, width: 48, height: 50, label: '607', corridor: 'north', pathNode: { x: 396, y: 75 } },
  { id: 'FZ608', x: 430, y: 20, width: 48, height: 50, label: '608', corridor: 'north', pathNode: { x: 454, y: 75 } },
  { id: 'FZ609', x: 488, y: 20, width: 48, height: 50, label: '609', corridor: 'north', pathNode: { x: 512, y: 75 } },
  { id: 'FZ610', x: 546, y: 20, width: 48, height: 50, label: '610', corridor: 'north', pathNode: { x: 570, y: 75 } },
  { id: 'FZ611', x: 604, y: 20, width: 48, height: 50, label: '611', corridor: 'north', pathNode: { x: 628, y: 75 } },
  { id: 'FZ612', x: 662, y: 20, width: 48, height: 50, label: '612', corridor: 'north', pathNode: { x: 686, y: 75 } },
  { id: 'FZ613', x: 720, y: 20, width: 48, height: 50, label: '613', corridor: 'north', pathNode: { x: 744, y: 75 } },
  
  // A电梯（北侧中偏西）
  { id: 'A-elevator', x: 778, y: 15, width: 55, height: 55, label: 'A\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 805, y: 75 } },
  
  { id: 'FZ614', x: 843, y: 20, width: 48, height: 50, label: '614', corridor: 'north', pathNode: { x: 867, y: 75 } },
  { id: 'FZ615', x: 901, y: 20, width: 48, height: 50, label: '615', corridor: 'north', pathNode: { x: 925, y: 75 } },
  { id: 'FZ616', x: 959, y: 20, width: 48, height: 50, label: '616', corridor: 'north', pathNode: { x: 983, y: 75 } },
  { id: 'FZ617', x: 1017, y: 20, width: 48, height: 50, label: '617', corridor: 'north', pathNode: { x: 1041, y: 75 } },
  
  // C电梯（北侧中偏东）
  { id: 'C-elevator', x: 1075, y: 15, width: 55, height: 55, label: 'C\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 1102, y: 75 } },
  
  { id: 'FZ618', x: 1140, y: 20, width: 48, height: 50, label: '618', corridor: 'north', pathNode: { x: 1164, y: 75 } },
  { id: 'FZ619', x: 1198, y: 20, width: 48, height: 50, label: '619', corridor: 'north', pathNode: { x: 1222, y: 75 } },
  { id: 'FZ620', x: 1256, y: 20, width: 48, height: 50, label: '620', corridor: 'north', pathNode: { x: 1280, y: 75 } },
  { id: 'FZ621', x: 1314, y: 20, width: 48, height: 50, label: '621', corridor: 'north', pathNode: { x: 1338, y: 75 } },
  { id: 'FZ622', x: 1372, y: 20, width: 48, height: 50, label: '622', corridor: 'north', pathNode: { x: 1396, y: 75 } },
  { id: 'FZ623', x: 1430, y: 20, width: 48, height: 50, label: '623', corridor: 'north', pathNode: { x: 1454, y: 75 } },
  { id: 'FZ624', x: 1488, y: 20, width: 48, height: 50, label: '624', corridor: 'north', pathNode: { x: 1512, y: 75 } },
  { id: 'FZ625', x: 1546, y: 20, width: 48, height: 50, label: '625', corridor: 'north', pathNode: { x: 1570, y: 75 } },
  { id: 'FZ626', x: 1604, y: 20, width: 48, height: 50, label: '626', corridor: 'north', pathNode: { x: 1628, y: 75 } },
  { id: 'FZ627', x: 1662, y: 20, width: 48, height: 50, label: '627', corridor: 'north', pathNode: { x: 1686, y: 75 } },
  { id: 'FZ628', x: 1720, y: 20, width: 48, height: 50, label: '628', corridor: 'north', pathNode: { x: 1744, y: 75 } },
  
  // 北侧东段楼梯
  { id: 'stair-NE', x: 1778, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊房间（从北到南）==========
  { id: 'FF511', x: 1778, y: 80, width: 50, height: 45, label: 'F511', corridor: 'east', pathNode: { x: 1770, y: 102 } },
  { id: 'FF510', x: 1778, y: 135, width: 50, height: 45, label: 'F510', corridor: 'east', pathNode: { x: 1770, y: 157 } },
  { id: 'FF509', x: 1778, y: 190, width: 50, height: 45, label: 'F509', corridor: 'east', pathNode: { x: 1770, y: 212 } },
  { id: 'FF508', x: 1778, y: 245, width: 50, height: 45, label: 'F508', corridor: 'east', pathNode: { x: 1770, y: 267 } },
  { id: 'FF507', x: 1778, y: 300, width: 50, height: 45, label: 'F507', corridor: 'east', pathNode: { x: 1770, y: 322 } },
  { id: 'FF506', x: 1778, y: 355, width: 50, height: 45, label: 'F506', corridor: 'east', pathNode: { x: 1770, y: 377 } },
  
  // 东侧楼梯
  { id: 'stair-EN', x: 1778, y: 410, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FF505', x: 1778, y: 470, width: 50, height: 45, label: 'F505', corridor: 'east', pathNode: { x: 1770, y: 492 } },
  { id: 'FF504', x: 1778, y: 525, width: 50, height: 45, label: 'F504', corridor: 'east', pathNode: { x: 1770, y: 547 } },
  { id: 'FF503', x: 1778, y: 580, width: 50, height: 45, label: 'F503', corridor: 'east', pathNode: { x: 1770, y: 602 } },
  { id: 'FF502', x: 1778, y: 635, width: 50, height: 45, label: 'F502', corridor: 'east', pathNode: { x: 1770, y: 657 } },
  { id: 'FF501', x: 1778, y: 690, width: 50, height: 45, label: 'F501', corridor: 'east', pathNode: { x: 1770, y: 712 } },
  
  // ========== 南侧走廊房间（从西到东）==========
  { id: 'FZ657', x: 80, y: 740, width: 50, height: 50, label: '657', corridor: 'south', pathNode: { x: 105, y: 735 } },
  { id: 'FZ656', x: 140, y: 740, width: 50, height: 50, label: '656', corridor: 'south', pathNode: { x: 165, y: 735 } },
  
  // 南侧西段楼梯
  { id: 'stair-SW', x: 200, y: 740, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ644', x: 260, y: 740, width: 48, height: 50, label: '644', corridor: 'south', pathNode: { x: 284, y: 735 } },
  { id: 'FZ645', x: 318, y: 740, width: 48, height: 50, label: '645', corridor: 'south', pathNode: { x: 342, y: 735 } },
  { id: 'FZ646', x: 376, y: 740, width: 48, height: 50, label: '646', corridor: 'south', pathNode: { x: 400, y: 735 } },
  { id: 'FZ647', x: 434, y: 740, width: 48, height: 50, label: '647', corridor: 'south', pathNode: { x: 458, y: 735 } },
  { id: 'FZ648', x: 492, y: 740, width: 48, height: 50, label: '648', corridor: 'south', pathNode: { x: 516, y: 735 } },
  { id: 'FZ649', x: 550, y: 740, width: 48, height: 50, label: '649', corridor: 'south', pathNode: { x: 574, y: 735 } },
  { id: 'FZ650', x: 608, y: 740, width: 48, height: 50, label: '650', corridor: 'south', pathNode: { x: 632, y: 735 } },
  { id: 'FZ651', x: 666, y: 740, width: 48, height: 50, label: '651', corridor: 'south', pathNode: { x: 690, y: 735 } },
  { id: 'FZ652', x: 724, y: 740, width: 48, height: 50, label: '652', corridor: 'south', pathNode: { x: 748, y: 735 } },
  { id: 'FZ653', x: 782, y: 740, width: 48, height: 50, label: '653', corridor: 'south', pathNode: { x: 806, y: 735 } },
  { id: 'FZ654', x: 840, y: 740, width: 48, height: 50, label: '654', corridor: 'south', pathNode: { x: 864, y: 735 } },
  { id: 'FZ655', x: 898, y: 740, width: 48, height: 50, label: '655', corridor: 'south', pathNode: { x: 922, y: 735 } },
  
  // B电梯（南侧中偏西）
  { id: 'B-elevator', x: 956, y: 735, width: 55, height: 55, label: 'B\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 983, y: 735 } },
  
  { id: 'FZ640', x: 1021, y: 740, width: 48, height: 50, label: '640', corridor: 'south', pathNode: { x: 1045, y: 735 } },
  { id: 'FZ641', x: 1079, y: 740, width: 48, height: 50, label: '641', corridor: 'south', pathNode: { x: 1103, y: 735 } },
  { id: 'FZ642', x: 1137, y: 740, width: 48, height: 50, label: '642', corridor: 'south', pathNode: { x: 1161, y: 735 } },
  { id: 'FZ643', x: 1195, y: 740, width: 48, height: 50, label: '643', corridor: 'south', pathNode: { x: 1219, y: 735 } },
  
  // D电梯（南侧中偏东）
  { id: 'D-elevator', x: 1253, y: 735, width: 55, height: 55, label: 'D\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 1280, y: 735 } },
  
  { id: 'FZ629', x: 1318, y: 740, width: 48, height: 50, label: '629', corridor: 'south', pathNode: { x: 1342, y: 735 } },
  { id: 'FZ630', x: 1376, y: 740, width: 48, height: 50, label: '630', corridor: 'south', pathNode: { x: 1400, y: 735 } },
  { id: 'FZ631', x: 1434, y: 740, width: 48, height: 50, label: '631', corridor: 'south', pathNode: { x: 1458, y: 735 } },
  { id: 'FZ632', x: 1492, y: 740, width: 48, height: 50, label: '632', corridor: 'south', pathNode: { x: 1516, y: 735 } },
  { id: 'FZ633', x: 1550, y: 740, width: 48, height: 50, label: '633', corridor: 'south', pathNode: { x: 1574, y: 735 } },
  { id: 'FZ634', x: 1608, y: 740, width: 48, height: 50, label: '634', corridor: 'south', pathNode: { x: 1632, y: 735 } },
  { id: 'FZ635', x: 1666, y: 740, width: 48, height: 50, label: '635', corridor: 'south', pathNode: { x: 1690, y: 735 } },
  { id: 'FZ636', x: 1724, y: 740, width: 48, height: 50, label: '636', corridor: 'south', pathNode: { x: 1748, y: 735 } },
  { id: 'FZ637', x: 1782, y: 740, width: 48, height: 50, label: '637', corridor: 'south', pathNode: { x: 1806, y: 735 } },
  
  // ========== 中心区域 ==========
  { id: 'center-area', x: 80, y: 80, width: 1690, height: 650, label: '中心区域', type: 'feature', corridor: 'center', pathNode: { x: 925, y: 405 } },
];

// ==================== 七楼平面图 ====================
// 四走廊围绕布局，走廊之间不连通
const floor7Rooms: RoomData[] = [
  // ========== 西侧走廊房间（从北到南）==========
  { id: 'FZ701', x: 20, y: 80, width: 50, height: 50, label: '701', corridor: 'west', pathNode: { x: 75, y: 105 } },
  { id: 'FZ702', x: 20, y: 140, width: 50, height: 50, label: '702', corridor: 'west', pathNode: { x: 75, y: 165 } },
  { id: 'FZ703', x: 20, y: 200, width: 50, height: 50, label: '703', corridor: 'west', pathNode: { x: 75, y: 225 } },
  { id: 'FZ704', x: 20, y: 260, width: 50, height: 50, label: '704', corridor: 'west', pathNode: { x: 75, y: 285 } },
  { id: 'FZ705', x: 20, y: 320, width: 50, height: 50, label: '705', corridor: 'west', pathNode: { x: 75, y: 345 } },
  { id: 'FZ706', x: 20, y: 380, width: 50, height: 50, label: '706', corridor: 'west', pathNode: { x: 75, y: 405 } },
  { id: 'FZ707', x: 20, y: 440, width: 50, height: 50, label: '707', corridor: 'west', pathNode: { x: 75, y: 465 } },
  { id: 'FZ708', x: 20, y: 500, width: 50, height: 50, label: '708', corridor: 'west', pathNode: { x: 75, y: 525 } },
  
  // 西侧楼梯
  { id: 'stair-WN', x: 20, y: 560, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ789', x: 20, y: 620, width: 50, height: 50, label: '789', corridor: 'west', pathNode: { x: 75, y: 645 } },
  { id: 'FZ790', x: 20, y: 680, width: 50, height: 50, label: '790', corridor: 'west', pathNode: { x: 75, y: 705 } },
  { id: 'FZ791', x: 20, y: 740, width: 50, height: 50, label: '791', corridor: 'west', pathNode: { x: 75, y: 765 } },
  { id: 'FZ792', x: 20, y: 800, width: 50, height: 50, label: '792', corridor: 'west', pathNode: { x: 75, y: 825 } },
  { id: 'FZ793', x: 20, y: 860, width: 50, height: 50, label: '793', corridor: 'west', pathNode: { x: 75, y: 885 } },
  { id: 'FZ794', x: 20, y: 920, width: 50, height: 50, label: '794', corridor: 'west', pathNode: { x: 75, y: 945 } },
  { id: 'FZ795', x: 20, y: 980, width: 50, height: 50, label: '795', corridor: 'west', pathNode: { x: 75, y: 1005 } },
  { id: 'FZ796', x: 20, y: 1040, width: 50, height: 50, label: '796', corridor: 'west', pathNode: { x: 75, y: 1065 } },
  
  // ========== 北侧走廊房间（从西到东）==========
  { id: 'stair-NW', x: 80, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ709', x: 140, y: 20, width: 48, height: 50, label: '709', corridor: 'north', pathNode: { x: 164, y: 75 } },
  { id: 'FZ710', x: 198, y: 20, width: 48, height: 50, label: '710', corridor: 'north', pathNode: { x: 222, y: 75 } },
  { id: 'FZ711', x: 256, y: 20, width: 48, height: 50, label: '711', corridor: 'north', pathNode: { x: 280, y: 75 } },
  { id: 'FZ712', x: 314, y: 20, width: 48, height: 50, label: '712', corridor: 'north', pathNode: { x: 338, y: 75 } },
  { id: 'FZ713', x: 372, y: 20, width: 48, height: 50, label: '713', corridor: 'north', pathNode: { x: 396, y: 75 } },
  { id: 'FZ714', x: 430, y: 20, width: 48, height: 50, label: '714', corridor: 'north', pathNode: { x: 454, y: 75 } },
  { id: 'FZ715', x: 488, y: 20, width: 48, height: 50, label: '715', corridor: 'north', pathNode: { x: 512, y: 75 } },
  { id: 'FZ716', x: 546, y: 20, width: 48, height: 50, label: '716', corridor: 'north', pathNode: { x: 570, y: 75 } },
  { id: 'FZ717', x: 604, y: 20, width: 48, height: 50, label: '717', corridor: 'north', pathNode: { x: 628, y: 75 } },
  { id: 'FZ718', x: 662, y: 20, width: 48, height: 50, label: '718', corridor: 'north', pathNode: { x: 686, y: 75 } },
  { id: 'FZ719', x: 720, y: 20, width: 48, height: 50, label: '719', corridor: 'north', pathNode: { x: 744, y: 75 } },
  { id: 'FZ720', x: 778, y: 20, width: 48, height: 50, label: '720', corridor: 'north', pathNode: { x: 802, y: 75 } },
  { id: 'FZ721', x: 836, y: 20, width: 48, height: 50, label: '721', corridor: 'north', pathNode: { x: 860, y: 75 } },
  { id: 'FZ722', x: 894, y: 20, width: 48, height: 50, label: '722', corridor: 'north', pathNode: { x: 918, y: 75 } },
  { id: 'FZ723', x: 952, y: 20, width: 48, height: 50, label: '723', corridor: 'north', pathNode: { x: 976, y: 75 } },
  { id: 'FZ724', x: 1010, y: 20, width: 48, height: 50, label: '724', corridor: 'north', pathNode: { x: 1034, y: 75 } },
  
  // A电梯（北侧中偏西）
  { id: 'A-elevator', x: 1068, y: 15, width: 55, height: 55, label: 'A\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 1095, y: 75 } },
  
  { id: 'FZ725', x: 1133, y: 20, width: 48, height: 50, label: '725', corridor: 'north', pathNode: { x: 1157, y: 75 } },
  { id: 'FZ726', x: 1191, y: 20, width: 48, height: 50, label: '726', corridor: 'north', pathNode: { x: 1215, y: 75 } },
  { id: 'FZ727', x: 1249, y: 20, width: 48, height: 50, label: '727', corridor: 'north', pathNode: { x: 1273, y: 75 } },
  { id: 'FZ728', x: 1307, y: 20, width: 48, height: 50, label: '728', corridor: 'north', pathNode: { x: 1331, y: 75 } },
  { id: 'FZ729', x: 1365, y: 20, width: 48, height: 50, label: '729', corridor: 'north', pathNode: { x: 1389, y: 75 } },
  
  // C电梯（北侧中偏东）
  { id: 'C-elevator', x: 1423, y: 15, width: 55, height: 55, label: 'C\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 1450, y: 75 } },
  
  { id: 'FZ730', x: 1488, y: 20, width: 48, height: 50, label: '730', corridor: 'north', pathNode: { x: 1512, y: 75 } },
  { id: 'FZ731', x: 1546, y: 20, width: 48, height: 50, label: '731', corridor: 'north', pathNode: { x: 1570, y: 75 } },
  { id: 'FZ732', x: 1604, y: 20, width: 48, height: 50, label: '732', corridor: 'north', pathNode: { x: 1628, y: 75 } },
  { id: 'FZ733', x: 1662, y: 20, width: 48, height: 50, label: '733', corridor: 'north', pathNode: { x: 1686, y: 75 } },
  { id: 'FZ734', x: 1720, y: 20, width: 48, height: 50, label: '734', corridor: 'north', pathNode: { x: 1744, y: 75 } },
  { id: 'FZ735', x: 1778, y: 20, width: 48, height: 50, label: '735', corridor: 'north', pathNode: { x: 1802, y: 75 } },
  { id: 'FZ736', x: 1836, y: 20, width: 48, height: 50, label: '736', corridor: 'north', pathNode: { x: 1860, y: 75 } },
  { id: 'FZ737', x: 1894, y: 20, width: 48, height: 50, label: '737', corridor: 'north', pathNode: { x: 1918, y: 75 } },
  { id: 'FZ738', x: 1952, y: 20, width: 48, height: 50, label: '738', corridor: 'north', pathNode: { x: 1976, y: 75 } },
  { id: 'FZ739', x: 2010, y: 20, width: 48, height: 50, label: '739', corridor: 'north', pathNode: { x: 2034, y: 75 } },
  { id: 'FZ740', x: 2068, y: 20, width: 48, height: 50, label: '740', corridor: 'north', pathNode: { x: 2092, y: 75 } },
  { id: 'FZ741', x: 2126, y: 20, width: 48, height: 50, label: '741', corridor: 'north', pathNode: { x: 2150, y: 75 } },
  { id: 'FZ742', x: 2184, y: 20, width: 48, height: 50, label: '742', corridor: 'north', pathNode: { x: 2208, y: 75 } },
  { id: 'FZ743', x: 2242, y: 20, width: 48, height: 50, label: '743', corridor: 'north', pathNode: { x: 2266, y: 75 } },
  { id: 'FZ744', x: 2300, y: 20, width: 48, height: 50, label: '744', corridor: 'north', pathNode: { x: 2324, y: 75 } },
  { id: 'FZ745', x: 2358, y: 20, width: 48, height: 50, label: '745', corridor: 'north', pathNode: { x: 2382, y: 75 } },
  { id: 'FZ746', x: 2416, y: 20, width: 48, height: 50, label: '746', corridor: 'north', pathNode: { x: 2440, y: 75 } },
  { id: 'FZ747', x: 2474, y: 20, width: 48, height: 50, label: '747', corridor: 'north', pathNode: { x: 2498, y: 75 } },
  { id: 'FZ748', x: 2532, y: 20, width: 48, height: 50, label: '748', corridor: 'north', pathNode: { x: 2556, y: 75 } },
  
  // 北侧东段楼梯
  { id: 'stair-NE', x: 2590, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊房间（从北到南）==========
  { id: 'FF610', x: 2590, y: 80, width: 50, height: 50, label: 'F610', corridor: 'east', pathNode: { x: 2582, y: 105 } },
  { id: 'FF609', x: 2590, y: 140, width: 50, height: 50, label: 'F609', corridor: 'east', pathNode: { x: 2582, y: 165 } },
  
  // 东侧楼梯
  { id: 'stair-EN', x: 2590, y: 200, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FF608', x: 2590, y: 260, width: 50, height: 50, label: 'F608', corridor: 'east', pathNode: { x: 2582, y: 285 } },
  { id: 'FF607', x: 2590, y: 320, width: 50, height: 50, label: 'F607', corridor: 'east', pathNode: { x: 2582, y: 345 } },
  { id: 'FF606', x: 2590, y: 380, width: 50, height: 50, label: 'F606', corridor: 'east', pathNode: { x: 2582, y: 405 } },
  { id: 'FF605', x: 2590, y: 440, width: 50, height: 50, label: 'F605', corridor: 'east', pathNode: { x: 2582, y: 465 } },
  { id: 'FF604', x: 2590, y: 500, width: 50, height: 50, label: 'F604', corridor: 'east', pathNode: { x: 2582, y: 525 } },
  { id: 'FF603', x: 2590, y: 560, width: 50, height: 50, label: 'F603', corridor: 'east', pathNode: { x: 2582, y: 585 } },
  { id: 'FF602', x: 2590, y: 620, width: 50, height: 50, label: 'F602', corridor: 'east', pathNode: { x: 2582, y: 645 } },
  
  // 东侧楼梯
  { id: 'stair-ES', x: 2590, y: 680, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 南侧走廊房间（从西到东）==========
  { id: 'FZ782', x: 80, y: 1100, width: 50, height: 50, label: '782', corridor: 'south', pathNode: { x: 105, y: 1095 } },
  { id: 'FZ783', x: 140, y: 1100, width: 50, height: 50, label: '783', corridor: 'south', pathNode: { x: 165, y: 1095 } },
  { id: 'FZ784', x: 200, y: 1100, width: 50, height: 50, label: '784', corridor: 'south', pathNode: { x: 225, y: 1095 } },
  { id: 'FZ785', x: 260, y: 1100, width: 50, height: 50, label: '785', corridor: 'south', pathNode: { x: 285, y: 1095 } },
  { id: 'FZ786', x: 320, y: 1100, width: 50, height: 50, label: '786', corridor: 'south', pathNode: { x: 345, y: 1095 } },
  { id: 'FZ787', x: 380, y: 1100, width: 50, height: 50, label: '787', corridor: 'south', pathNode: { x: 405, y: 1095 } },
  { id: 'FZ788', x: 440, y: 1100, width: 50, height: 50, label: '788', corridor: 'south', pathNode: { x: 465, y: 1095 } },
  { id: 'FZ781', x: 500, y: 1100, width: 50, height: 50, label: '781', corridor: 'south', pathNode: { x: 525, y: 1095 } },
  { id: 'FZ773', x: 560, y: 1100, width: 50, height: 50, label: '773', corridor: 'south', pathNode: { x: 585, y: 1095 } },
  { id: 'FZ774', x: 620, y: 1100, width: 50, height: 50, label: '774', corridor: 'south', pathNode: { x: 645, y: 1095 } },
  { id: 'FZ775', x: 680, y: 1100, width: 50, height: 50, label: '775', corridor: 'south', pathNode: { x: 705, y: 1095 } },
  { id: 'FZ776', x: 740, y: 1100, width: 50, height: 50, label: '776', corridor: 'south', pathNode: { x: 765, y: 1095 } },
  { id: 'FZ777', x: 800, y: 1100, width: 50, height: 50, label: '777', corridor: 'south', pathNode: { x: 825, y: 1095 } },
  { id: 'FZ778', x: 860, y: 1100, width: 50, height: 50, label: '778', corridor: 'south', pathNode: { x: 885, y: 1095 } },
  { id: 'FZ779', x: 920, y: 1100, width: 50, height: 50, label: '779', corridor: 'south', pathNode: { x: 945, y: 1095 } },
  { id: 'FZ780', x: 980, y: 1100, width: 50, height: 50, label: '780', corridor: 'south', pathNode: { x: 1005, y: 1095 } },
  
  // B电梯（南侧中偏西）
  { id: 'B-elevator', x: 1040, y: 1095, width: 55, height: 55, label: 'B\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 1067, y: 1095 } },
  
  { id: 'FZ767', x: 1105, y: 1100, width: 50, height: 50, label: '767', corridor: 'south', pathNode: { x: 1130, y: 1095 } },
  { id: 'FZ768', x: 1165, y: 1100, width: 50, height: 50, label: '768', corridor: 'south', pathNode: { x: 1190, y: 1095 } },
  { id: 'FZ769', x: 1225, y: 1100, width: 50, height: 50, label: '769', corridor: 'south', pathNode: { x: 1250, y: 1095 } },
  { id: 'FZ770', x: 1285, y: 1100, width: 50, height: 50, label: '770', corridor: 'south', pathNode: { x: 1310, y: 1095 } },
  { id: 'FZ771', x: 1345, y: 1100, width: 50, height: 50, label: '771', corridor: 'south', pathNode: { x: 1370, y: 1095 } },
  { id: 'FZ772', x: 1405, y: 1100, width: 50, height: 50, label: '772', corridor: 'south', pathNode: { x: 1430, y: 1095 } },
  
  // D电梯（南侧中偏东）
  { id: 'D-elevator', x: 1465, y: 1095, width: 55, height: 55, label: 'D\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 1492, y: 1095 } },
  
  { id: 'FZ749', x: 1530, y: 1100, width: 50, height: 50, label: '749', corridor: 'south', pathNode: { x: 1555, y: 1095 } },
  { id: 'FZ750', x: 1590, y: 1100, width: 50, height: 50, label: '750', corridor: 'south', pathNode: { x: 1615, y: 1095 } },
  { id: 'FZ751', x: 1650, y: 1100, width: 50, height: 50, label: '751', corridor: 'south', pathNode: { x: 1675, y: 1095 } },
  { id: 'FZ752', x: 1710, y: 1100, width: 50, height: 50, label: '752', corridor: 'south', pathNode: { x: 1735, y: 1095 } },
  { id: 'FZ753', x: 1770, y: 1100, width: 50, height: 50, label: '753', corridor: 'south', pathNode: { x: 1795, y: 1095 } },
  { id: 'FZ754', x: 1830, y: 1100, width: 50, height: 50, label: '754', corridor: 'south', pathNode: { x: 1855, y: 1095 } },
  { id: 'FZ755', x: 1890, y: 1100, width: 50, height: 50, label: '755', corridor: 'south', pathNode: { x: 1915, y: 1095 } },
  { id: 'FZ756', x: 1950, y: 1100, width: 50, height: 50, label: '756', corridor: 'south', pathNode: { x: 1975, y: 1095 } },
  { id: 'FZ757', x: 2010, y: 1100, width: 50, height: 50, label: '757', corridor: 'south', pathNode: { x: 2035, y: 1095 } },
  { id: 'FZ758', x: 2070, y: 1100, width: 50, height: 50, label: '758', corridor: 'south', pathNode: { x: 2095, y: 1095 } },
  { id: 'FZ759', x: 2130, y: 1100, width: 50, height: 50, label: '759', corridor: 'south', pathNode: { x: 2155, y: 1095 } },
  { id: 'FZ760', x: 2190, y: 1100, width: 50, height: 50, label: '760', corridor: 'south', pathNode: { x: 2215, y: 1095 } },
  { id: 'FZ761', x: 2250, y: 1100, width: 50, height: 50, label: '761', corridor: 'south', pathNode: { x: 2275, y: 1095 } },
  { id: 'FZ762', x: 2310, y: 1100, width: 50, height: 50, label: '762', corridor: 'south', pathNode: { x: 2335, y: 1095 } },
  { id: 'FZ763', x: 2370, y: 1100, width: 50, height: 50, label: '763', corridor: 'south', pathNode: { x: 2395, y: 1095 } },
  { id: 'FZ764', x: 2430, y: 1100, width: 50, height: 50, label: '764', corridor: 'south', pathNode: { x: 2455, y: 1095 } },
  { id: 'FZ765', x: 2490, y: 1100, width: 50, height: 50, label: '765', corridor: 'south', pathNode: { x: 2515, y: 1095 } },
  { id: 'FZ766', x: 2550, y: 1100, width: 50, height: 50, label: '766', corridor: 'south', pathNode: { x: 2575, y: 1095 } },
  
  // 南侧东段楼梯
  { id: 'stair-SE', x: 2610, y: 1100, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 中心区域 ==========
  { id: 'center-area', x: 80, y: 80, width: 2500, height: 1010, label: '中心区域', type: 'feature', corridor: 'center', pathNode: { x: 1330, y: 590 } },
];

// ==================== 八楼平面图 ====================
// 独特布局，多个功能区
const floor8Rooms: RoomData[] = [
  // ========== 北侧走廊房间（从西到东）==========
  // 网络舆情监测与分析中心（西北角）
  { id: 'research-center', x: 20, y: 20, width: 120, height: 60, label: '网络舆情监测中心', type: 'feature', corridor: 'north-west', pathNode: { x: 80, y: 85 } },
  
  // A电梯
  { id: 'A-elevator', x: 150, y: 15, width: 55, height: 55, label: 'A\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 177, y: 75 } },
  
  { id: 'FZ807', x: 215, y: 20, width: 48, height: 50, label: '807', corridor: 'north', pathNode: { x: 239, y: 75 } },
  { id: 'FZ808', x: 273, y: 20, width: 48, height: 50, label: '808', corridor: 'north', pathNode: { x: 297, y: 75 } },
  { id: 'FZ809', x: 331, y: 20, width: 48, height: 50, label: '809', corridor: 'north', pathNode: { x: 355, y: 75 } },
  { id: 'FZ810', x: 389, y: 20, width: 48, height: 50, label: '810', corridor: 'north', pathNode: { x: 413, y: 75 } },
  { id: 'FZ811', x: 447, y: 20, width: 48, height: 50, label: '811', corridor: 'north', pathNode: { x: 471, y: 75 } },
  { id: 'FZ812', x: 505, y: 20, width: 48, height: 50, label: '812', corridor: 'north', pathNode: { x: 529, y: 75 } },
  
  // C电梯
  { id: 'C-elevator', x: 563, y: 15, width: 55, height: 55, label: 'C\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 590, y: 75 } },
  
  { id: 'FZ813', x: 628, y: 20, width: 48, height: 50, label: '813', corridor: 'north', pathNode: { x: 652, y: 75 } },
  { id: 'FZ814', x: 686, y: 20, width: 48, height: 50, label: '814', corridor: 'north', pathNode: { x: 710, y: 75 } },
  { id: 'FZ815', x: 744, y: 20, width: 48, height: 50, label: '815', corridor: 'north', pathNode: { x: 768, y: 75 } },
  { id: 'FZ816', x: 802, y: 20, width: 48, height: 50, label: '816', corridor: 'north', pathNode: { x: 826, y: 75 } },
  { id: 'FZ817', x: 860, y: 20, width: 48, height: 50, label: '817', corridor: 'north', pathNode: { x: 884, y: 75 } },
  
  // 北侧东段楼梯
  { id: 'stair-NE', x: 918, y: 20, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 西侧走廊房间（从北到南）==========
  { id: 'ecom-center', x: 20, y: 90, width: 120, height: 150, label: '电子商务协同创新中心', type: 'feature', corridor: 'west', pathNode: { x: 80, y: 165 } },
  { id: 'digital-research', x: 20, y: 250, width: 120, height: 200, label: '西部数字研究院', type: 'feature', corridor: 'west', pathNode: { x: 80, y: 350 } },
  
  // 西侧楼梯
  { id: 'stair-W', x: 20, y: 460, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FZ825', x: 20, y: 520, width: 50, height: 50, label: '825', corridor: 'west', pathNode: { x: 75, y: 545 } },
  { id: 'FZ826', x: 20, y: 580, width: 50, height: 50, label: '826', corridor: 'west', pathNode: { x: 75, y: 605 } },
  
  // B电梯
  { id: 'B-elevator', x: 20, y: 640, width: 55, height: 55, label: 'B\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 47, y: 645 } },
  
  // ========== 南侧走廊房间（从西到东）==========
  { id: 'FZ827', x: 85, y: 650, width: 48, height: 50, label: '827', corridor: 'south', pathNode: { x: 109, y: 645 } },
  { id: 'FZ828', x: 143, y: 650, width: 48, height: 50, label: '828', corridor: 'south', pathNode: { x: 167, y: 645 } },
  { id: 'FZ829', x: 201, y: 650, width: 48, height: 50, label: '829', corridor: 'south', pathNode: { x: 225, y: 645 } },
  { id: 'FZ830', x: 259, y: 650, width: 48, height: 50, label: '830', corridor: 'south', pathNode: { x: 283, y: 645 } },
  
  // D电梯
  { id: 'D-elevator', x: 317, y: 645, width: 55, height: 55, label: 'D\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 344, y: 645 } },
  
  { id: 'study-room', x: 382, y: 550, width: 150, height: 100, label: '自修室', type: 'feature', corridor: 'south', pathNode: { x: 457, y: 600 } },
  
  { id: 'FZ819', x: 542, y: 560, width: 48, height: 50, label: '819', corridor: 'south', pathNode: { x: 566, y: 585 } },
  { id: 'FZ820', x: 600, y: 560, width: 48, height: 50, label: '820', corridor: 'south', pathNode: { x: 624, y: 585 } },
  { id: 'FZ821', x: 658, y: 560, width: 48, height: 50, label: '821', corridor: 'south', pathNode: { x: 682, y: 585 } },
  { id: 'FZ822', x: 716, y: 560, width: 48, height: 50, label: '822', corridor: 'south', pathNode: { x: 740, y: 585 } },
  
  // 南侧东段楼梯
  { id: 'stair-SE', x: 774, y: 560, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  // ========== 东侧走廊房间（从北到南）==========
  { id: 'FF706', x: 838, y: 80, width: 50, height: 45, label: 'F706', corridor: 'east', pathNode: { x: 830, y: 102 } },
  { id: 'FF705', x: 838, y: 135, width: 50, height: 45, label: 'F705', corridor: 'east', pathNode: { x: 830, y: 157 } },
  
  // 东侧楼梯
  { id: 'stair-EN', x: 838, y: 190, width: 50, height: 50, label: '楼梯', type: 'stair' },
  
  { id: 'FF704', x: 838, y: 250, width: 50, height: 45, label: 'F704', corridor: 'east', pathNode: { x: 830, y: 272 } },
  { id: 'FF703', x: 838, y: 305, width: 50, height: 45, label: 'F703', corridor: 'east', pathNode: { x: 830, y: 327 } },
  { id: 'FF702', x: 838, y: 360, width: 50, height: 45, label: 'F702', corridor: 'east', pathNode: { x: 830, y: 382 } },
  { id: 'FF701', x: 838, y: 415, width: 50, height: 45, label: 'F701', corridor: 'east', pathNode: { x: 830, y: 437 } },
  
  // 阳台
  { id: 'balcony', x: 838, y: 470, width: 50, height: 80, label: '阳台', type: 'feature', corridor: 'east', pathNode: { x: 863, y: 510 } },
  
  // ========== 中心区域 ==========
  { id: 'center-area', x: 150, y: 90, width: 680, height: 450, label: '中心区域', type: 'feature', corridor: 'center', pathNode: { x: 490, y: 315 } },
];

// ==================== 一楼平面图 ====================
// 东西两个区域，中间电动车停车场分隔
// 西侧区域：实验室、乒乓球室、羽毛球室、大厅
// 东侧区域：逸夫报告厅
const floor1Rooms: RoomData[] = [
  // ========== 西侧区域 - 北侧房间（从西到东）==========
  // 西北侧楼梯
  { id: 'stair-NW', x: 40, y: 15, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  { id: 'FZ106', x: 100, y: 15, width: 50, height: 45, label: '106', corridor: 'north-west', pathNode: { x: 125, y: 95 } },
  { id: 'FZ107', x: 160, y: 15, width: 50, height: 45, label: '107', corridor: 'north-west', pathNode: { x: 185, y: 95 } },
  { id: 'FZ108', x: 220, y: 15, width: 50, height: 45, label: '108', corridor: 'north-west', pathNode: { x: 245, y: 95 } },
  { id: 'FZ109', x: 280, y: 15, width: 50, height: 45, label: '109', corridor: 'north-west', pathNode: { x: 305, y: 95 } },
  
  // 实验室区域
  { id: 'lab', x: 340, y: 15, width: 100, height: 80, label: '实验室', type: 'feature', corridor: 'north-west', pathNode: { x: 390, y: 95 } },
  
  // 乒乓球室
  { id: 'pingpong', x: 450, y: 15, width: 80, height: 60, label: '乒乓球室', type: 'feature', corridor: 'north', pathNode: { x: 490, y: 95 } },
  
  // 羽毛球室
  { id: 'badminton', x: 540, y: 15, width: 80, height: 60, label: '羽毛球室', type: 'feature', corridor: 'north', pathNode: { x: 580, y: 95 } },
  
  // A电梯（西侧区域右上角）
  { id: 'A-elevator', x: 630, y: 15, width: 50, height: 50, label: 'A\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 655, y: 90 } },
  
  // ========== 西侧区域 - 中间房间 ==========
  { id: 'FZ101', x: 40, y: 100, width: 50, height: 45, label: '101', corridor: 'west', pathNode: { x: 65, y: 122 } },
  { id: 'FZ102', x: 40, y: 155, width: 50, height: 45, label: '102', corridor: 'west', pathNode: { x: 65, y: 177 } },
  { id: 'FZ103', x: 40, y: 210, width: 50, height: 45, label: '103', corridor: 'west', pathNode: { x: 65, y: 232 } },
  
  { id: 'FZ104', x: 100, y: 100, width: 50, height: 45, label: '104', corridor: 'center-west', pathNode: { x: 125, y: 122 } },
  { id: 'FZ105', x: 160, y: 100, width: 50, height: 45, label: '105', corridor: 'center-west', pathNode: { x: 185, y: 122 } },
  
  { id: 'FZ158', x: 100, y: 155, width: 50, height: 45, label: '158', corridor: 'center-west', pathNode: { x: 125, y: 177 } },
  { id: 'FZ159', x: 160, y: 155, width: 50, height: 45, label: '159', corridor: 'center-west', pathNode: { x: 185, y: 177 } },
  
  { id: 'FZ111', x: 220, y: 100, width: 45, height: 45, label: '111', corridor: 'center-west', pathNode: { x: 242, y: 122 } },
  { id: 'FZ112', x: 275, y: 100, width: 45, height: 45, label: '112', corridor: 'center-west', pathNode: { x: 297, y: 122 } },
  { id: 'FZ113', x: 330, y: 100, width: 45, height: 45, label: '113', corridor: 'center-west', pathNode: { x: 352, y: 122 } },
  { id: 'FZ114', x: 385, y: 100, width: 45, height: 45, label: '114', corridor: 'center-west', pathNode: { x: 407, y: 122 } },
  { id: 'FZ115', x: 440, y: 100, width: 45, height: 45, label: '115', corridor: 'center-west', pathNode: { x: 462, y: 122 } },
  
  { id: 'FZ110', x: 495, y: 100, width: 45, height: 45, label: '110', corridor: 'center-west', pathNode: { x: 517, y: 122 } },
  
  // 大厅
  { id: 'lobby', x: 550, y: 100, width: 120, height: 150, label: '大厅', type: 'feature', corridor: 'center', pathNode: { x: 610, y: 175 } },
  
  // ========== 西侧区域 - 下层房间 ==========
  { id: 'FZ160', x: 100, y: 250, width: 50, height: 45, label: '160', corridor: 'center-west', pathNode: { x: 125, y: 272 } },
  { id: 'FZ161', x: 160, y: 250, width: 50, height: 45, label: '161', corridor: 'center-west', pathNode: { x: 185, y: 272 } },
  { id: 'FZ162', x: 220, y: 250, width: 50, height: 45, label: '162', corridor: 'center-west', pathNode: { x: 245, y: 272 } },
  
  { id: 'FZ151', x: 280, y: 250, width: 50, height: 45, label: '151', corridor: 'center-west', pathNode: { x: 305, y: 272 } },
  { id: 'FZ152', x: 340, y: 250, width: 50, height: 45, label: '152', corridor: 'center-west', pathNode: { x: 365, y: 272 } },
  
  { id: 'FZ447', x: 400, y: 250, width: 50, height: 45, label: '447', corridor: 'center-west', pathNode: { x: 425, y: 272 } },
  { id: 'FZ448', x: 460, y: 250, width: 50, height: 45, label: '448', corridor: 'center-west', pathNode: { x: 485, y: 272 } },
  
  // ========== 西侧区域 - 南侧房间 ==========
  // 西南侧楼梯
  { id: 'stair-SW', x: 40, y: 600, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  { id: 'FZ240', x: 100, y: 600, width: 50, height: 45, label: '240', corridor: 'south-west', pathNode: { x: 125, y: 555 } },
  { id: 'FZ241', x: 160, y: 600, width: 50, height: 45, label: '241', corridor: 'south-west', pathNode: { x: 185, y: 555 } },
  { id: 'FZ242', x: 220, y: 600, width: 50, height: 45, label: '242', corridor: 'south-west', pathNode: { x: 245, y: 555 } },
  
  { id: 'FZ232', x: 280, y: 600, width: 45, height: 45, label: '232', corridor: 'south-west', pathNode: { x: 302, y: 555 } },
  { id: 'FZ233', x: 335, y: 600, width: 45, height: 45, label: '233', corridor: 'south-west', pathNode: { x: 357, y: 555 } },
  { id: 'FZ234', x: 390, y: 600, width: 45, height: 45, label: '234', corridor: 'south-west', pathNode: { x: 412, y: 555 } },
  { id: 'FZ235', x: 445, y: 600, width: 45, height: 45, label: '235', corridor: 'south-west', pathNode: { x: 467, y: 555 } },
  { id: 'FZ236', x: 500, y: 600, width: 45, height: 45, label: '236', corridor: 'south-west', pathNode: { x: 522, y: 555 } },
  { id: 'FZ237', x: 555, y: 600, width: 45, height: 45, label: '237', corridor: 'south-west', pathNode: { x: 577, y: 555 } },
  
  // B电梯（西侧区域右下角）
  { id: 'B-elevator', x: 610, y: 575, width: 50, height: 50, label: 'B\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 635, y: 560 } },
  
  // ========== 电动车停车场（中间分隔区域）==========
  { id: 'parking', x: 680, y: 150, width: 150, height: 350, label: '电动车停车场', type: 'feature', corridor: 'center', pathNode: { x: 755, y: 325 } },
  
  // ========== 东侧区域 - 北侧房间 ==========
  // C电梯（东侧区域左上角）
  { id: 'C-elevator', x: 850, y: 15, width: 50, height: 50, label: 'C\n电梯', type: 'elevator', corridor: 'north', pathNode: { x: 875, y: 90 } },
  
  { id: 'FZ117', x: 910, y: 15, width: 45, height: 45, label: '117', corridor: 'north-east', pathNode: { x: 932, y: 95 } },
  { id: 'FZ118', x: 965, y: 15, width: 45, height: 45, label: '118', corridor: 'north-east', pathNode: { x: 987, y: 95 } },
  { id: 'FZ119', x: 1020, y: 15, width: 45, height: 45, label: '119', corridor: 'north-east', pathNode: { x: 1042, y: 95 } },
  { id: 'FZ120', x: 1075, y: 15, width: 45, height: 45, label: '120', corridor: 'north-east', pathNode: { x: 1097, y: 95 } },
  { id: 'FZ121', x: 1130, y: 15, width: 45, height: 45, label: '121', corridor: 'north-east', pathNode: { x: 1152, y: 95 } },
  { id: 'FZ122', x: 1185, y: 15, width: 45, height: 45, label: '122', corridor: 'north-east', pathNode: { x: 1207, y: 95 } },
  { id: 'FZ123', x: 1240, y: 15, width: 45, height: 45, label: '123', corridor: 'north-east', pathNode: { x: 1262, y: 95 } },
  { id: 'FZ124', x: 1295, y: 15, width: 45, height: 45, label: '124', corridor: 'north-east', pathNode: { x: 1317, y: 95 } },
  
  // 东北侧楼梯
  { id: 'stair-NE', x: 1350, y: 15, width: 50, height: 45, label: '楼梯', type: 'stair' },
  
  // ========== 东侧区域 - 中间房间 ==========
  { id: 'FZ125', x: 910, y: 100, width: 45, height: 45, label: '125', corridor: 'east-north', pathNode: { x: 932, y: 122 } },
  { id: 'FZ126', x: 910, y: 155, width: 45, height: 45, label: '126', corridor: 'east-north', pathNode: { x: 932, y: 177 } },
  { id: 'FZ127', x: 910, y: 210, width: 45, height: 45, label: '127', corridor: 'east-north', pathNode: { x: 932, y: 232 } },
  { id: 'FZ128', x: 910, y: 265, width: 45, height: 45, label: '128', corridor: 'east-north', pathNode: { x: 932, y: 287 } },
  
  { id: 'FF108', x: 960, y: 100, width: 45, height: 40, label: 'F108', corridor: 'east-north', pathNode: { x: 982, y: 120 } },
  { id: 'FF109', x: 960, y: 150, width: 45, height: 40, label: 'F109', corridor: 'east-north', pathNode: { x: 982, y: 170 } },
  
  // 逸夫报告厅
  { id: 'auditorium', x: 1010, y: 100, width: 200, height: 180, label: '逸夫报告厅', type: 'feature', corridor: 'center-east', pathNode: { x: 1110, y: 190 } },
  
  { id: 'FZ129', x: 1220, y: 100, width: 45, height: 45, label: '129', corridor: 'east-north', pathNode: { x: 1242, y: 122 } },
  { id: 'FZ130', x: 1275, y: 100, width: 45, height: 45, label: '130', corridor: 'east-north', pathNode: { x: 1297, y: 122 } },
  { id: 'FZ131', x: 1330, y: 100, width: 45, height: 45, label: '131', corridor: 'east-north', pathNode: { x: 1352, y: 122 } },
  
  { id: 'FZ132', x: 1220, y: 155, width: 45, height: 45, label: '132', corridor: 'east-north', pathNode: { x: 1242, y: 177 } },
  { id: 'FZ133', x: 1275, y: 155, width: 45, height: 45, label: '133', corridor: 'east-north', pathNode: { x: 1297, y: 177 } },
  { id: 'FZ134', x: 1330, y: 155, width: 45, height: 45, label: '134', corridor: 'east-north', pathNode: { x: 1352, y: 177 } },
  
  // ========== 东侧区域 - 下层房间 ==========
  { id: 'FF104', x: 910, y: 320, width: 45, height: 40, label: 'F104', corridor: 'east-south', pathNode: { x: 932, y: 340 } },
  { id: 'FF105', x: 910, y: 370, width: 45, height: 40, label: 'F105', corridor: 'east-south', pathNode: { x: 932, y: 390 } },
  { id: 'FF106', x: 910, y: 420, width: 45, height: 40, label: 'F106', corridor: 'east-south', pathNode: { x: 932, y: 440 } },
  { id: 'FF107', x: 910, y: 470, width: 45, height: 40, label: 'F107', corridor: 'east-south', pathNode: { x: 932, y: 490 } },
  
  { id: 'FZ136', x: 960, y: 320, width: 45, height: 45, label: '136', corridor: 'east-south', pathNode: { x: 982, y: 342 } },
  { id: 'FZ137', x: 960, y: 375, width: 45, height: 45, label: '137', corridor: 'east-south', pathNode: { x: 982, y: 397 } },
  
  { id: 'FZ138', x: 1010, y: 320, width: 45, height: 45, label: '138', corridor: 'east-south', pathNode: { x: 1032, y: 342 } },
  { id: 'FZ139', x: 1060, y: 320, width: 45, height: 45, label: '139', corridor: 'east-south', pathNode: { x: 1082, y: 342 } },
  { id: 'FZ140', x: 1110, y: 320, width: 45, height: 45, label: '140', corridor: 'east-south', pathNode: { x: 1132, y: 342 } },
  
  { id: 'FZ141', x: 1010, y: 375, width: 45, height: 45, label: '141', corridor: 'east-south', pathNode: { x: 1032, y: 397 } },
  { id: 'FZ142', x: 1060, y: 375, width: 45, height: 45, label: '142', corridor: 'east-south', pathNode: { x: 1082, y: 397 } },
  { id: 'FZ143', x: 1110, y: 375, width: 45, height: 45, label: '143', corridor: 'east-south', pathNode: { x: 1132, y: 397 } },
  { id: 'FZ144', x: 1160, y: 375, width: 45, height: 45, label: '144', corridor: 'east-south', pathNode: { x: 1182, y: 397 } },
  { id: 'FZ145', x: 1210, y: 375, width: 45, height: 45, label: '145', corridor: 'east-south', pathNode: { x: 1232, y: 397 } },
  { id: 'FZ146', x: 1260, y: 375, width: 45, height: 45, label: '146', corridor: 'east-south', pathNode: { x: 1282, y: 397 } },
  { id: 'FZ135', x: 1310, y: 375, width: 45, height: 45, label: '135', corridor: 'east-south', pathNode: { x: 1332, y: 397 } },
  
  // ========== 东侧区域 - 南侧房间 ==========
  { id: 'FF101', x: 1310, y: 600, width: 45, height: 40, label: 'F101', corridor: 'south-east', pathNode: { x: 1332, y: 555 } },
  
  // D电梯（东侧区域右下角）
  { id: 'D-elevator', x: 850, y: 575, width: 50, height: 50, label: 'D\n电梯', type: 'elevator', corridor: 'south', pathNode: { x: 875, y: 560 } },
  
  // 东南侧楼梯
  { id: 'stair-SE', x: 1350, y: 600, width: 50, height: 45, label: '楼梯', type: 'stair' },
];

// 楼层平面图数据映射
const floorPlanData: Record<number, RoomData[]> = {
  1: floor1Rooms,
  2: floor2Rooms,
  3: floor3Rooms,
  4: floor4Rooms,
  5: floor5Rooms,
  6: floor6Rooms,
  7: floor7Rooms,
  8: floor8Rooms,
};

// 楼层视图尺寸
const floorViewBox: Record<number, { width: number; height: number }> = {
  1: { width: 1420, height: 660 },
  2: { width: 1420, height: 660 },
  3: { width: 1420, height: 660 },
  4: { width: 1420, height: 660 },
  5: { width: 1420, height: 660 },
  6: { width: 1420, height: 660 },
  7: { width: 1420, height: 660 },
  8: { width: 1420, height: 660 },
};

// ==================== 路径节点定义 ====================
// 定义每个楼层的关键路径节点
interface PathNode {
  id: string;
  x: number;
  y: number;
  type: 'corridor' | 'elevator' | 'stair' | 'room';
  connections: string[]; // 相连的节点ID
}

// 楼层走廊连通性配置
interface FloorConnectivity {
  northConnected: boolean;      // 北侧走廊是否贯通
  southConnected: boolean;      // 南侧走廊是否贯通
  eastConnected: boolean;       // 东侧走廊是否贯通
  westConnected: boolean;       // 西侧走廊是否贯通
  northEastBreak: number;       // 北侧走廊断开位置（X坐标）
  southEastBreak: number;       // 南侧走廊断开位置（X坐标）
  eastBreak: number;            // 东侧走廊断开位置（Y坐标）
  cornerConnected: boolean;     // 四角是否连通
  canDetourOutside?: boolean;   // 是否可以绕建筑外边走（如2楼广场）
}

// 各楼层连通性配置
// 说明：
// - 1楼：全部连通
// - 2楼：走廊不连通，但是广场可以绕外边走（实际可通行）
// - 3楼：走廊断开的地方都不连通
// - 4楼：南北两侧走廊不连通
// - 5楼、6楼、7楼、8楼：全部连通
const floorConnectivity: Record<number, FloorConnectivity> = {
  1: { 
    northConnected: true, 
    southConnected: true, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 0, 
    southEastBreak: 0,
    eastBreak: 0,
    cornerConnected: true
  },
  2: { 
    northConnected: false, 
    southConnected: false, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 670, 
    southEastBreak: 670,
    eastBreak: 0,
    cornerConnected: true, // 广场可以绕行
    canDetourOutside: true // 2楼可以绕广场外边走
  },
  3: { 
    northConnected: false, 
    southConnected: false, 
    eastConnected: false, 
    westConnected: true,
    northEastBreak: 670, 
    southEastBreak: 670,
    eastBreak: 345,
    cornerConnected: false
  },
  4: { 
    northConnected: false, 
    southConnected: false, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 670, 
    southEastBreak: 670,
    eastBreak: 0,
    cornerConnected: false // 南北走廊不连通
  },
  5: { 
    northConnected: true, 
    southConnected: true, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 0, 
    southEastBreak: 0,
    eastBreak: 0,
    cornerConnected: true
  },
  6: { 
    northConnected: true, 
    southConnected: true, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 0, 
    southEastBreak: 0,
    eastBreak: 0,
    cornerConnected: false
  },
  7: { 
    northConnected: true, 
    southConnected: true, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 0, 
    southEastBreak: 0,
    eastBreak: 0,
    cornerConnected: false
  },
  8: { 
    northConnected: true, 
    southConnected: true, 
    eastConnected: true, 
    westConnected: true,
    northEastBreak: 0, 
    southEastBreak: 0,
    eastBreak: 0,
    cornerConnected: false
  },
};

// 走廊关键节点坐标（用于路径计算）
const corridorNodes = {
  // 北侧走廊节点
  northWest: { x: 50, y: 80 },      // 西北角
  northA: { x: 640, y: 80 },        // A电梯附近
  northC: { x: 755, y: 80 },        // C电梯附近
  northEast: { x: 1310, y: 80 },    // 东北角
  
  // 南侧走廊节点
  southWest: { x: 50, y: 570 },     // 西南角
  southB: { x: 640, y: 570 },       // B电梯附近
  southD: { x: 755, y: 570 },       // D电梯附近
  southEast: { x: 1310, y: 570 },   // 东南角
  
 // 东侧走廊节点
  eastNorth: { x: 1310, y: 160 },   // 东侧北端
  eastSouth: { x: 1310, y: 535 },   // 东侧南端
  
  // 西侧走廊节点
  westNorth: { x: 50, y: 160 },     // 西侧北端
  westSouth: { x: 50, y: 535 },     // 西侧南端
};

// Dijkstra最短路径算法
function findShortestPath(
  startNode: { x: number; y: number; corridor: string },
  endNode: { x: number; y: number; corridor: string },
  floor: number
): { path: { x: number; y: number }[]; distance: number; needsDetour: boolean; detourInfo?: string } {
  const connectivity = floorConnectivity[floor];
  const path: { x: number; y: number }[] = [];
  
  // 简化路径计算：基于走廊连通性
  const startCorridor = startNode.corridor;
  const endCorridor = endNode.corridor;
  
  // 同一走廊，直接走
  if (startCorridor === endCorridor || 
      (startCorridor.includes('north') && endCorridor.includes('north')) ||
      (startCorridor.includes('south') && endCorridor.includes('south')) ||
      (startCorridor.includes('east') && endCorridor.includes('east')) ||
      (startCorridor.includes('west') && endCorridor.includes('west'))) {
    path.push({ x: startNode.x, y: startNode.y });
    path.push({ x: endNode.x, y: endNode.y });
    return { path, distance: getDistance(startNode, endNode), needsDetour: false };
  }
  
  // 判断是否需要绕行
  let needsDetour = false;
  let detourInfo = '';
  
  // 计算路径
  path.push({ x: startNode.x, y: startNode.y });
  
  // 根据楼层连通性判断路径
  const isNorthSide = (c: string) => c.includes('north');
  const isSouthSide = (c: string) => c.includes('south');
  const isEastSide = (c: string) => c.includes('east');
  const isWestSide = (c: string) => c.includes('west') && !c.includes('east');
  
  const startIsNorth = isNorthSide(startCorridor);
  const endIsNorth = isNorthSide(endCorridor);
  const startIsSouth = isSouthSide(startCorridor);
  const endIsSouth = isSouthSide(endCorridor);
  const startIsEast = isEastSide(startCorridor);
  const endIsEast = isEastSide(endCorridor);
  const startIsWest = isWestSide(startCorridor);
  const endIsWest = isWestSide(endCorridor);
  
  // 根据楼层特性计算路径
  // 1楼：全部连通
  if (floor === 1) {
    // 任意位置都可以直接到达
    path.push({ x: endNode.x, y: endNode.y });
    return { path, distance: getDistance(startNode, endNode), needsDetour: false };
  }
  
  // 2楼：可以绕广场外边走，实际全部连通
  if (floor === 2) {
    // 可以绕广场外边走
    path.push({ x: endNode.x, y: endNode.y });
    return { path, distance: getDistance(startNode, endNode), needsDetour: false };
  }
  
  // 3楼：走廊断开的地方都不连通
  if (floor === 3) {
    // 同一侧可以直接走
    if ((startIsNorth && endIsNorth) || (startIsSouth && endIsSouth) ||
        (startIsEast && endIsEast) || (startIsWest && endIsWest)) {
      path.push({ x: endNode.x, y: endNode.y });
      return { path, distance: getDistance(startNode, endNode), needsDetour: false };
    }
    // 不同走廊之间无法通行
    needsDetour = true;
    detourInfo = '3楼走廊断开，不同走廊间无法通行，需乘坐电梯到其他楼层绕行';
  }
  
  // 4楼：南北走廊不连通，但可以通过东侧走廊绕行
  if (floor === 4) {
    if (startIsNorth !== endIsNorth) {
      // 南北之间，检查是否可以通过东侧走廊
      // 东侧走廊入口在北侧东段和南侧东段
      const startCanEnterEast = startCorridor === 'north-east' || startCorridor === 'south-east' || startIsEast;
      const endCanEnterEast = endCorridor === 'north-east' || endCorridor === 'south-east' || endIsEast;
      
      if (startCanEnterEast || endCanEnterEast || startIsEast || endIsEast) {
        // 可以通过东侧走廊绕行
        const eastX = 1568;
        const northY = 75;
        const southY = 600;
        
        if (startIsNorth) {
          path.push({ x: startNode.x, y: northY });
          path.push({ x: eastX, y: northY });
          path.push({ x: eastX, y: southY });
          path.push({ x: endNode.x, y: southY });
        } else {
          path.push({ x: startNode.x, y: southY });
          path.push({ x: eastX, y: southY });
          path.push({ x: eastX, y: northY });
          path.push({ x: endNode.x, y: northY });
        }
        path.push({ x: endNode.x, y: endNode.y });
      } else {
        // 无法通过东侧走廊
        needsDetour = true;
        detourInfo = '4楼南北走廊不连通，当前电梯位置无法到达东侧走廊入口';
      }
    } else {
      // 同侧直接走
      path.push({ x: endNode.x, y: endNode.y });
    }
  }
  
  // 5楼、6楼、7楼、8楼：全部连通
  if (floor === 5 || floor === 6 || floor === 7 || floor === 8) {
    // 任意位置都可以直接到达
    path.push({ x: endNode.x, y: endNode.y });
    return { path, distance: getDistance(startNode, endNode), needsDetour: false };
  }
  
  // 计算总距离
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += getDistance(path[i - 1], path[i]);
  }
  
  return { path, distance: needsDetour ? Infinity : totalDistance, needsDetour, detourInfo };
}

// 计算两点之间的曼哈顿距离
function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

// 判断电梯是否可以到达目标房间（考虑走廊连通性）
// 连通性规则：
// - 1楼：全部连通
// - 2楼：走廊不连通但可以绕广场外边走（实际可通行）
// - 3楼：走廊断开的地方都不连通
// - 4楼：南北走廊不连通
// - 5-8楼：全部连通
function canElevatorReachRoom(
  elevatorId: string,
  targetFloor: number,
  targetCorridor: string
): { canReach: boolean; reason: string } {
  const targetRooms = floorPlanData[targetFloor];
  if (!targetRooms) return { canReach: true, reason: '数据缺失，默认可达' };
  
  const elevatorData = targetRooms.find(r => r.id === `${elevatorId}-elevator`);
  if (!elevatorData) return { canReach: true, reason: '电梯数据缺失，默认可达' };
  
  const elevatorCorridor = elevatorData.corridor || 'center';
  const connectivity = floorConnectivity[targetFloor];
  
  // 1楼、5楼、6楼、7楼、8楼：全部连通
  if (targetFloor === 1 || targetFloor === 5 || targetFloor === 6 || targetFloor === 7 || targetFloor === 8) {
    return { canReach: true, reason: `${targetFloor}楼全部连通` };
  }
  
  // 2楼：可以绕广场外边走
  if (targetFloor === 2) {
    return { canReach: true, reason: '2楼可绕广场外边通行' };
  }
  
  // 辅助函数：判断走廊位置
  const isNorthSide = (c: string) => c.includes('north');
  const isSouthSide = (c: string) => c.includes('south');
  const isEastSide = (c: string) => c.includes('east');
  const isWestSide = (c: string) => c.includes('west') && !c.includes('east');
  
  // 同一侧的走廊可以直接到达
  if (isNorthSide(elevatorCorridor) && isNorthSide(targetCorridor)) {
    return { canReach: true, reason: '同在北侧走廊' };
  }
  if (isSouthSide(elevatorCorridor) && isSouthSide(targetCorridor)) {
    return { canReach: true, reason: '同在南侧走廊' };
  }
  if (isEastSide(elevatorCorridor) && isEastSide(targetCorridor)) {
    return { canReach: true, reason: '同在东侧走廊' };
  }
  if (isWestSide(elevatorCorridor) && isWestSide(targetCorridor)) {
    return { canReach: true, reason: '同在西侧走廊' };
  }
  
  // 3楼：走廊断开的地方都不连通
  // 3楼北侧走廊断开，南侧走廊断开，东侧走廊也断开
  if (targetFloor === 3) {
    // 不同走廊之间无法通行
    return { canReach: false, reason: '3楼走廊断开，不同走廊间无法通行' };
  }
  
  // 4楼：南北走廊不连通
  if (targetFloor === 4) {
    // 东侧走廊连通南北
    if (isEastSide(targetCorridor)) {
      // 要到达东侧走廊，需要从北侧东段或南侧东段进入
      if (elevatorCorridor === 'north-east') {
        return { canReach: true, reason: '北侧东段可直接进入东侧走廊' };
      }
      if (elevatorCorridor === 'south-east') {
        return { canReach: true, reason: '南侧东段可直接进入东侧走廊' };
      }
      // 北侧西段无法到达东侧（北侧走廊不连通）
      // 南侧西段无法到达东侧（南侧走廊不连通）
      return { canReach: false, reason: '4楼北侧/南侧走廊不连通，无法到达东侧走廊' };
    }
    
    // 目标在西侧走廊
    if (isWestSide(targetCorridor)) {
      if (elevatorCorridor === 'north-west') {
        return { canReach: true, reason: '北侧西段可直接进入西侧走廊' };
      }
      if (elevatorCorridor === 'south-west') {
        return { canReach: true, reason: '南侧西段可直接进入西侧走廊' };
      }
      return { canReach: false, reason: '4楼北侧/南侧走廊不连通，无法到达西侧走廊' };
    }
    
    // 目标在北侧，电梯在南侧（或反之）
    // 南北之间无法直接通行，除非通过东侧走廊
    if ((isNorthSide(targetCorridor) && isSouthSide(elevatorCorridor)) ||
        (isSouthSide(targetCorridor) && isNorthSide(elevatorCorridor))) {
      // 只有电梯在东侧走廊入口位置才能绕行
      if (elevatorCorridor === 'north-east' || elevatorCorridor === 'south-east') {
        return { canReach: true, reason: '可通过东侧走廊绕行' };
      }
      return { canReach: false, reason: '4楼南北走廊不连通' };
    }
  }
  
  // 默认情况
  return { canReach: true, reason: '默认可达' };
}

// 找到最优电梯 - 考虑起点位置、终点位置和走廊连通性
function findOptimalElevator(
  startFloor: number,
  startRoom: string | null,
  targetFloor: number,
  targetRoom: string
): { elevator: string; reason: string; needsTransfer?: boolean; transferInfo?: string } {
  // 获取两楼层都有的电梯
  const startElevators = floorConfig[startFloor]?.elevators || ['A', 'B', 'C', 'D'];
  const targetElevators = floorConfig[targetFloor]?.elevators || ['A', 'B', 'C', 'D'];
  const commonElevators = startElevators.filter(e => targetElevators.includes(e));
  
  if (commonElevators.length === 0) {
    // 没有共同电梯，需要换乘（简化处理，返回第一个可用电梯）
    return { elevator: startElevators[0] || 'A', reason: '需要换乘电梯', needsTransfer: true };
  }
  
  if (commonElevators.length === 1) {
    return { elevator: commonElevators[0], reason: '唯一可用电梯' };
  }
  
  // 如果起点是教室，计算到各电梯的距离
  if (startRoom && startFloor === targetFloor) {
    const startRooms = floorPlanData[startFloor];
    const targetRooms = floorPlanData[targetFloor];
    if (!startRooms || !targetRooms) {
      return { elevator: commonElevators[0], reason: '默认电梯' };
    }
    
    const startRoomData = startRooms.find(r => r.id === startRoom);
    const targetRoomData = targetRooms.find(r => r.id === targetRoom);
    
    if (startRoomData?.pathNode && targetRoomData?.pathNode) {
      // 同一楼层，直接导航，不需要电梯
      return { elevator: '', reason: '同层导航' };
    }
  }
  
  // 获取目标房间的走廊位置
  const targetRooms = floorPlanData[targetFloor];
  const targetRoomData = targetRooms?.find(r => r.id === targetRoom);
  const targetCorridor = targetRoomData?.corridor || 'center';
  
  // 筛选可以到达目标走廊的电梯
  const reachableElevators: { id: string; distance: number; reason: string }[] = [];
  const unreachableElevators: { id: string; reason: string }[] = [];
  
  for (const elevatorId of commonElevators) {
    const { canReach, reason } = canElevatorReachRoom(elevatorId, targetFloor, targetCorridor);
    const elevatorData = targetRooms?.find(r => r.id === `${elevatorId}-elevator`);
    
    if (canReach) {
      const distance = elevatorData?.pathNode && targetRoomData?.pathNode
        ? getDistance(elevatorData.pathNode, targetRoomData.pathNode)
        : 0;
      reachableElevators.push({ id: elevatorId, distance, reason });
    } else {
      unreachableElevators.push({ id: elevatorId, reason });
    }
  }
  
  // 如果有可达的电梯，选择距离最近的
  if (reachableElevators.length > 0) {
    reachableElevators.sort((a, b) => a.distance - b.distance);
    return { 
      elevator: reachableElevators[0].id, 
      reason: reachableElevators[0].reason 
    };
  }
  
  // 如果没有可达的电梯，需要提示换乘
  // 尝试找到一个可以到达目标的电梯，建议用户换乘
  const bestAlternative = unreachableElevators.length > 0 ? unreachableElevators[0] : null;
  
  return { 
    elevator: commonElevators[0], 
    reason: '需要换乘电梯到达目标区域',
    needsTransfer: true,
    transferInfo: bestAlternative 
      ? `${targetFloor}楼走廊不连通。建议方案：\n1. 乘坐当前电梯下到5楼（全连通楼层）\n2. 经5楼走廊到达可到达目标的电梯位置\n3. 乘合适电梯返回${targetFloor}楼`
      : `${targetFloor}楼走廊不连通，建议：在5楼下电梯 → 经走廊到达目标区域对应位置 → 再乘电梯返回${targetFloor}楼`
  };
}

// 导航结果类型
interface NavigationResult {
  steps: { step: number; text: string }[];
  pathPoints: string;
  endX: number;
  endY: number;
  displayFloor: number;
  startFloor: number;
  targetFloor: number;
  optimalElevator: string;
  isSameFloor: boolean;
}

// 动态导航路径生成 - 支持多种起点类型
function generateNavigationPath(
  startType: StartType,
  startElevator: string,
  startFloor: number,
  startRoom: string,
  targetFloor: number,
  targetRoom: string
): NavigationResult {
  const targetRooms = floorPlanData[targetFloor];
  if (!targetRooms) {
    return { steps: [], pathPoints: '', endX: 0, endY: 0, displayFloor: targetFloor, startFloor, targetFloor, optimalElevator: '', isSameFloor: false };
  }
  
  // 找到目标房间
  const target = targetRooms.find(r => r.id === targetRoom);
  let endX = 400;
  let endY = 220;
  let targetCorridor = 'center';
  
  if (target && target.pathNode) {
    endX = target.pathNode.x;
    endY = target.pathNode.y;
    targetCorridor = target.corridor || 'center';
  }
  
  const steps: { step: number; text: string }[] = [];
  const pathPoints: number[][] = [];
  
  // 判断是否同一楼层
  const isSameFloor = startType === 'room' && startFloor === targetFloor;
  
  // 找到最优电梯
  const { elevator: optimalElevator, reason, needsTransfer, transferInfo } = findOptimalElevator(
    startFloor,
    startType === 'room' ? startRoom : null,
    targetFloor,
    targetRoom
  );
  
  let startX = 400;
  let startY = 100;
  let startCorridor = 'north';
  
  if (isSameFloor) {
    // 同一楼层导航
    const startRoomData = targetRooms.find(r => r.id === startRoom);
    if (startRoomData?.pathNode) {
      startX = startRoomData.pathNode.x;
      startY = startRoomData.pathNode.y;
      startCorridor = startRoomData.corridor || 'center';
    }
    
    steps.push({ step: 1, text: `从 ${startRoom} 出发` });
    
    // 使用新的路径算法
    const { path, needsDetour, detourInfo } = findShortestPath(
      { x: startX, y: startY, corridor: startCorridor },
      { x: endX, y: endY, corridor: targetCorridor },
      targetFloor
    );
    
    if (needsDetour) {
      // 走廊不连通，需要下楼绕行
      steps.push({ step: 2, text: `⚠️ ${detourInfo || '走廊不连通'}` });
      steps.push({ step: 3, text: `建议：乘坐电梯下到5楼（全连通）→ 经走廊到达对应区域 → 再上楼返回${targetFloor}楼` });
      pathPoints.push([startX, startY]);
      pathPoints.push([endX, endY]);
    } else {
      // 生成路径点
      path.forEach(p => pathPoints.push([p.x, p.y]));
      
      // 生成导航指引
      if (startCorridor === targetCorridor || 
          (startCorridor.includes('north') && targetCorridor.includes('north')) ||
          (startCorridor.includes('south') && targetCorridor.includes('south'))) {
        steps.push({ step: 2, text: `沿${getCorridorName(startCorridor)}走廊直行` });
      } else {
        steps.push({ step: 2, text: `沿走廊向目标方向行走` });
      }
    }
    steps.push({ step: steps.length + 1, text: `到达目标教室 ${targetRoom}` });
    
  } else if (startType === 'elevator') {
    // 从电梯出发
    const elevatorRoom = targetRooms.find(r => r.id === `${startElevator}-elevator`);
    if (elevatorRoom?.pathNode) {
      startX = elevatorRoom.pathNode.x;
      startY = elevatorRoom.pathNode.y;
      startCorridor = elevatorRoom.corridor || 'north';
    }
    
    // 检查当前电梯是否能到达目标
    const { canReach, reason: reachReason } = canElevatorReachRoom(startElevator, targetFloor, targetCorridor);
    
    if (!canReach) {
      // 当前电梯无法到达目标，提示换乘
      steps.push({ step: 1, text: `乘坐 ${startElevator} 电梯到 ${targetFloor} 楼` });
      steps.push({ step: 2, text: `⚠️ ${startElevator}电梯所在走廊无法直接到达目标区域` });
      steps.push({ step: 3, text: `原因：${reachReason}` });
      steps.push({ step: 4, text: `💡 建议：乘坐 ${startElevator} 电梯下到5楼（全连通）→ 经走廊到达目标区域对应位置 → 再乘合适电梯返回${targetFloor}楼` });
      
      pathPoints.push([startX, startY]);
      pathPoints.push([endX, endY]);
    } else {
      // 当前电梯可以到达目标
      steps.push({ step: 1, text: `乘坐 ${startElevator} 电梯到 ${targetFloor} 楼` });
      steps.push({ step: 2, text: `从${startElevator}电梯出来` });
      
      // 使用新的路径算法
      const { path: path2, needsDetour: needsDetour2, detourInfo: detourInfo2 } = findShortestPath(
        { x: startX, y: startY, corridor: startCorridor },
        { x: endX, y: endY, corridor: targetCorridor },
        targetFloor
      );
      
      pathPoints.push([startX, startY]);
      
      if (needsDetour2) {
        steps.push({ step: 3, text: `⚠️ ${detourInfo2 || '走廊不连通，需绕行'}` });
        steps.push({ step: 4, text: `建议：返回电梯 → 下到5楼 → 经走廊到达对应区域 → 再上楼返回${targetFloor}楼` });
        pathPoints.push([endX, endY]);
      } else {
        path2.slice(1).forEach(p => pathPoints.push([p.x, p.y]));
        
        if (startCorridor === targetCorridor || 
            (startCorridor.includes('north') && targetCorridor.includes('north')) ||
            (startCorridor.includes('south') && targetCorridor.includes('south'))) {
          steps.push({ step: 3, text: `沿${getCorridorName(startCorridor)}走廊直行` });
        } else {
          steps.push({ step: 3, text: `沿走廊向目标方向行走` });
        }
      }
    }
    steps.push({ step: steps.length + 1, text: `到达目标教室 ${targetRoom}` });
    
  } else {
    // 从教室出发，跨楼层导航
    const startRooms = floorPlanData[startFloor];
    const startRoomData = startRooms?.find(r => r.id === startRoom);
    
    steps.push({ step: 1, text: `从 ${startRoom} 出发（${startFloor}楼）` });
    
    if (optimalElevator) {
      // 检查是否需要换乘
      if (needsTransfer) {
        // 没有直达电梯，需要换乘
        steps.push({ step: 2, text: `步行至 ${optimalElevator} 电梯` });
        steps.push({ step: 3, text: `⚠️ 目标楼层走廊不连通，无法直达` });
        steps.push({ step: 4, text: `💡 ${transferInfo || '建议换乘其他电梯'}` });
        pathPoints.push([startX, startY]);
        pathPoints.push([endX, endY]);
      } else {
        // 到电梯
        steps.push({ step: 2, text: `步行至 ${optimalElevator} 电梯` });
        steps.push({ step: 3, text: `乘坐 ${optimalElevator} 电梯到 ${targetFloor} 楼` });
        steps.push({ step: 4, text: `从${optimalElevator}电梯出来` });
        
        // 获取电梯位置
        const targetElevatorRoom = targetRooms.find(r => r.id === `${optimalElevator}-elevator`);
        if (targetElevatorRoom?.pathNode) {
          startX = targetElevatorRoom.pathNode.x;
          startY = targetElevatorRoom.pathNode.y;
          startCorridor = targetElevatorRoom.corridor || 'north';
        }
        
        // 使用新的路径算法
        const { path: path3, needsDetour: needsDetour3, detourInfo: detourInfo3 } = findShortestPath(
          { x: startX, y: startY, corridor: startCorridor },
          { x: endX, y: endY, corridor: targetCorridor },
          targetFloor
        );
        
        pathPoints.push([startX, startY]);
        
        if (needsDetour3) {
          steps.push({ step: 5, text: `⚠️ ${detourInfo3 || '走廊不连通，需绕行'}` });
          steps.push({ step: 6, text: `建议：返回电梯 → 下到5楼 → 经走廊到达对应区域 → 再上楼返回${targetFloor}楼` });
          pathPoints.push([endX, endY]);
        } else {
          path3.slice(1).forEach(p => pathPoints.push([p.x, p.y]));
          
          if (startCorridor === targetCorridor || 
              (startCorridor.includes('north') && targetCorridor.includes('north')) ||
              (startCorridor.includes('south') && targetCorridor.includes('south'))) {
            steps.push({ step: 5, text: `沿${getCorridorName(startCorridor)}走廊直行` });
          } else {
            steps.push({ step: 5, text: `沿走廊向目标方向行走` });
          }
        }
      }
      steps.push({ step: steps.length + 1, text: `到达目标教室 ${targetRoom}` });
    }
  }
  
  const pathString = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  
  return { 
    steps, 
    pathPoints: pathString, 
    endX, 
    endY, 
    displayFloor: targetFloor,
    startFloor,
    targetFloor,
    optimalElevator,
    isSameFloor
  };
}

// 获取走廊名称
function getCorridorName(corridor: string): string {
  const names: Record<string, string> = {
    'north': '北侧',
    'south': '南侧',
    'east': '东侧',
    'west': '西侧',
    'north-west': '北侧西段',
    'north-east': '北侧东段',
    'south-west': '南侧西段',
    'south-east': '南侧东段',
    'east-north': '东侧北段',
    'east-south': '东侧南段',
    'center': '中心'
  };
  return names[corridor] || corridor;
}

export default function Home() {
  const [pageState, setPageState] = useState<PageState>('input');
  
  // 起点相关状态
  const [startType, setStartType] = useState<StartType>('elevator');
  const [startElevator, setStartElevator] = useState<string>('A');
  const [startFloor, setStartFloor] = useState<number>(2);
  const [startRoom, setStartRoom] = useState<string>('');
  
  // 终点相关状态
  const [targetFloor, setTargetFloor] = useState<number>(2);
  const [targetRoom, setTargetRoom] = useState<string>('');
  
  // 导航页面当前显示的楼层地图（跨楼层时用于切换）
  const [activeMapFloor, setActiveMapFloor] = useState<number | null>(null);
  
  // 弹窗状态
  const [showStartFloorSelect, setShowStartFloorSelect] = useState(false);
  const [showStartRoomSelect, setShowStartRoomSelect] = useState(false);
  const [showTargetFloorSelect, setShowTargetFloorSelect] = useState(false);
  const [showTargetRoomSelect, setShowTargetRoomSelect] = useState(false);

  // 获取指定楼层的电梯配置
  const getFloorElevators = (floor: number) => floorConfig[floor]?.elevators || ['A', 'B', 'C', 'D'];
  
  // 获取当前起点楼层和目标楼层的共同电梯
  const commonElevators = useMemo(() => {
    const startElevators = getFloorElevators(startFloor);
    const targetElevators = getFloorElevators(targetFloor);
    return startElevators.filter(e => targetElevators.includes(e));
  }, [startFloor, targetFloor]);

  // 生成导航路径
  const navigation = useMemo(() => {
    if (!targetRoom) return { steps: [], pathPoints: '', endX: 0, endY: 0, displayFloor: targetFloor, startFloor, targetFloor, optimalElevator: '', isSameFloor: false };
    return generateNavigationPath(startType, startElevator, startFloor, startRoom, targetFloor, targetRoom);
  }, [startType, startElevator, startFloor, startRoom, targetFloor, targetRoom]);

  const handleConfirm = () => {
    if (targetRoom && (startType === 'elevator' || startRoom)) {
      setPageState('navigation');
      // 进入导航时，默认显示起点楼层地图
      setActiveMapFloor(startFloor);
    }
  };

  const handleEndNavigation = () => {
    setPageState('input');
  };
  
  // 当起点类型改变时重置相关状态
  const handleStartTypeChange = (type: StartType) => {
    setStartType(type);
    if (type === 'elevator') {
      setStartRoom('');
    }
  };

  // 渲染楼层平面图 - 使用图片
  // floorParam: 指定要渲染的楼层，不传则使用targetFloor
  const renderFloorPlan = (isZoomed: boolean = false, floorParam?: number) => {
    const displayFloor = floorParam ?? targetFloor;
    const floorImage = `/floor-${displayFloor}.png`;
    
    return (
      <div className={`relative w-full ${isZoomed ? 'min-h-[500px]' : 'h-64'} bg-white`}>
        {/* 楼层图片 */}
        <img 
          src={floorImage} 
          alt={`${displayFloor}层平面图`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 overflow-hidden bg-white">
              <img src="/logo.png" alt="西邮校徽" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900">逸夫楼导航系统</h1>
              <p className="text-xs text-gray-500">西安邮电大学东区</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{targetFloor}层</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 输入页面 */}
        {pageState === 'input' && (
          <div className="space-y-6">
            {/* 起点类型选择 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">1</span>
                </div>
                选择起点类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStartTypeChange('elevator')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    startType === 'elevator'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      startType === 'elevator' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <Locate className={`w-6 h-6 ${startType === 'elevator' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className={`font-medium ${startType === 'elevator' ? 'text-green-700' : 'text-gray-700'}`}>
                      电梯口
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleStartTypeChange('room')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    startType === 'room'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      startType === 'room' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <Building2 className={`w-6 h-6 ${startType === 'room' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className={`font-medium ${startType === 'room' ? 'text-green-700' : 'text-gray-700'}`}>
                      某个教室
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 起点详细选择 */}
            {startType === 'elevator' ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">2</span>
                  </div>
                  选择起点电梯
                </label>
                {/* 电梯位置示意图 + 按钮布局 */}
                <div className="flex justify-center px-14">
                  <div className="relative p-2 bg-gray-50 rounded-xl inline-block">
                    <img 
                      src="/elevator-map.png" 
                      alt="电梯位置示意图" 
                      className="w-full max-w-[220px] mx-auto block"
                    />
                    {/* 左侧 - A按钮对准A区 */}
                    <button
                      onClick={() => setStartElevator('A')}
                      className={`absolute left-[20%] top-[25%] -translate-y-1/2 -translate-x-full -ml-[24px] mt-[6px] w-10 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        startElevator === 'A'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm font-bold">A</span>
                    </button>
                    {/* 左侧 - B按钮对准B区 */}
                    <button
                      onClick={() => setStartElevator('B')}
                      className={`absolute left-[20%] top-[65%] -translate-y-1/2 -translate-x-full -ml-[24px] w-10 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        startElevator === 'B'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm font-bold">B</span>
                    </button>
                    {/* 右侧 - C按钮对准C区 */}
                    <button
                      onClick={() => setStartElevator('C')}
                      className={`absolute left-[70%] top-[25%] -translate-y-1/2 translate-x-full ml-2 mt-[6px] w-10 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        startElevator === 'C'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm font-bold">C</span>
                    </button>
                    {/* 右侧 - D按钮对准D区 */}
                    <button
                      onClick={() => setStartElevator('D')}
                      className={`absolute left-[70%] top-[65%] -translate-y-1/2 translate-x-full ml-2 w-10 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        startElevator === 'D'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm font-bold">D</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">2</span>
                  </div>
                  选择起点楼层和教室
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowStartFloorSelect(true)}
                    className="flex-1 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:border-green-400 transition-all"
                  >
                    <p className="text-xs text-gray-500 mb-1">起点楼层</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-700">{startFloor}层</span>
                      <ChevronRight className="w-5 h-5 text-green-400" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowStartRoomSelect(true)}
                    className="flex-1 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:border-green-400 transition-all"
                  >
                    <p className="text-xs text-gray-500 mb-1">起点教室</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-bold ${startRoom ? 'text-green-700' : 'text-gray-400'}`}>
                        {startRoom || '选择'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-green-400" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 终点选择 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">{startType === 'elevator' ? '3' : '3'}</span>
                </div>
                选择目标楼层和教室
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTargetFloorSelect(true)}
                  className="flex-1 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <p className="text-xs text-gray-500 mb-1">目标楼层</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-700">{targetFloor}层</span>
                    <ChevronRight className="w-5 h-5 text-blue-400" />
                  </div>
                </button>
                
                <button
                  onClick={() => setShowTargetRoomSelect(true)}
                  className="flex-1 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <p className="text-xs text-gray-500 mb-1">目标教室</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-bold ${targetRoom ? 'text-blue-700' : 'text-gray-400'}`}>
                      {targetRoom || '选择'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-blue-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={handleConfirm}
              disabled={!targetRoom || (startType === 'room' && !startRoom)}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                targetRoom && (startType === 'elevator' || startRoom)
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              开始导航
            </button>

            {/* 使用说明 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-3">使用说明</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                {['选择起点', '选择终点', '查看路线', '到达目的地'].map((step, index) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mb-2">
                      {index + 1}
                    </div>
                    <span className="text-xs text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 导航结果页面 */}
        {pageState === 'navigation' && (
          <div className="space-y-4">
            {/* 导航目标卡片 */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">导航至</p>
                  <h2 className="text-2xl font-bold">{targetRoom}</h2>
                  <p className="text-sm opacity-90 mt-1">逸夫楼 {targetFloor} 层</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm opacity-90">
               {startType === 'elevator' ? (
                  <span>从 {startElevator} 电梯出发</span>
                ) : (
                  <>
                    <span>从 {startRoom}（{startFloor}楼）出发</span>
                    <span>•</span>
                    <span>{startFloor !== targetFloor ? '跨楼层导航' : '同层导航'}</span>
                  </>
                )}
              </div>
            </div>

            {/* 同层导航提示 */}
            {navigation.isSameFloor && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">同层导航</p>
                    <p className="text-sm text-blue-600">无需乘坐电梯，直接步行前往</p>
                  </div>
                </div>
              </div>
            )}

            {/* 双地图显示区域 - 跨楼层导航（仅起点为教室时） */}
            {startType === 'room' && !navigation.isSameFloor && (
              <div className="space-y-3">
                {/* 地图切换标签 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveMapFloor(startFloor)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                      activeMapFloor === startFloor
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                        起
                      </span>
                      <span>{startFloor}楼 - {startRoom}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveMapFloor(targetFloor)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                      activeMapFloor === targetFloor
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                        终
                      </span>
                      <span>{targetFloor}楼 - {targetRoom}</span>
                    </div>
                  </button>
                </div>
                
                {/* 地图显示 */}
                <div
                  className="relative bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-sm cursor-pointer hover:border-blue-300 transition-all"
                  onClick={() => setPageState('map-zoom')}
                >
                  {renderFloorPlan(false, activeMapFloor ?? startFloor)}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full shadow-sm text-xs text-blue-600 font-medium">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>点击放大</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 单地图显示 - 同层导航 或 起点为电梯口 */}
            {(navigation.isSameFloor || startType === 'elevator') && (
              <div
                className="relative bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-sm cursor-pointer hover:border-blue-300 transition-all"
               onClick={() => {
                  setActiveMapFloor(targetFloor);
                  setPageState('map-zoom');
                }}
              >
                {renderFloorPlan()}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full shadow-sm text-xs text-blue-600 font-medium">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>点击放大</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-blue-600" />
                </div>
                路线指引
              </h3>
              <div className="space-y-3">
                {navigation.steps.map((item, index) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index === 0 ? 'bg-green-500' : index === navigation.steps.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      <span className="text-xs text-white font-medium">{item.step}</span>
                    </div>
                    <p className="text-gray-700 pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleEndNavigation}
              className="w-full py-4 rounded-2xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
            >
              结束导航
            </button>
          </div>
        )}
      </main>

      {/* 地图放大弹窗 */}
      {pageState === 'map-zoom' && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setPageState('navigation')}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-900">
                {navigation.isSameFloor 
                  ? `${targetFloor}层 平面图` 
                  : `${startType === 'elevator' ? targetFloor : (activeMapFloor ?? targetFloor)}层 平面图`
                }
              </h3>
              <button
                onClick={() => setPageState('navigation')}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="border-2 border-blue-100 rounded-xl overflow-auto max-h-[70vh]">
             {navigation.isSameFloor 
                ? renderFloorPlan(true) 
                : renderFloorPlan(true, startType === 'elevator' ? targetFloor : (activeMapFloor ?? targetFloor))
              }
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">点击空白区域返回导航</p>
          </div>
        </div>
      )}

      {/* 起点楼层选择弹窗 */}
      {showStartFloorSelect && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowStartFloorSelect(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">选择起点楼层</h3>
            <div className="grid grid-cols-4 gap-3">
              {floors.map((floor) => (
                <button
                  key={floor}
                  onClick={() => {
                    setStartFloor(floor);
                    setStartRoom('');
                    setShowStartFloorSelect(false);
                  }}
                  className={`p-4 rounded-xl font-bold transition-all ${
                    startFloor === floor
                      ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {floor}层
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 起点教室选择弹窗 */}
      {showStartRoomSelect && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowStartRoomSelect(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full p-6 animate-slide-up max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              选择 {startFloor}层 起点 ({(floorConfig[startFloor]?.rooms || []).length}个)
            </h3>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-4">
              {(floorConfig[startFloor]?.rooms || []).map((room) => (
                <button
                  key={room}
                  onClick={() => {
                    setStartRoom(room);
                    setShowStartRoomSelect(false);
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    startRoom === room
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 目标楼层选择弹窗 */}
      {showTargetFloorSelect && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowTargetFloorSelect(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">选择目标楼层</h3>
            <div className="grid grid-cols-4 gap-3">
              {floors.map((floor) => (
                <button
                  key={floor}
                  onClick={() => {
                    setTargetFloor(floor);
                    setTargetRoom('');
                    setShowTargetFloorSelect(false);
                  }}
                  className={`p-4 rounded-xl font-bold transition-all ${
                    targetFloor === floor
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {floor}层
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 目标教室选择弹窗 */}
      {showTargetRoomSelect && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowTargetRoomSelect(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full p-6 animate-slide-up max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              选择 {targetFloor}层 教室 ({(floorConfig[targetFloor]?.rooms || []).length}个)
            </h3>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-4">
              {(floorConfig[targetFloor]?.rooms || []).map((room) => (
                <button
                  key={room}
                  onClick={() => {
                    setTargetRoom(room);
                    setShowTargetRoomSelect(false);
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    targetRoom === room
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 自定义样式 */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
