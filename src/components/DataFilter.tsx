'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, Button, Space, Tag } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';

// 筛选条件接口
interface FilterCondition {
  field: string;
  operator: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
}

// 筛选配置接口
interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: { label: string; value: string }[];
}

interface DataFilterProps {
  filters: FilterConfig[];
  onFilterChange: (conditions: FilterCondition[]) => void;
  onSearch: (keyword: string) => void;
}

const DataFilter: React.FC<DataFilterProps> = ({ filters, onFilterChange, onSearch }) => {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 添加筛选条件
  const addCondition = (field: string) => {
    const newCondition: FilterCondition = {
      field,
      operator: 'contains',
      value: ''
    };
    setConditions([...conditions, newCondition]);
  };

  // 更新筛选条件
  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const updated = conditions.map((c, i) => 
      i === index ? { ...c, ...updates } : c
    );
    setConditions(updated);
    onFilterChange(updated);
  };

  // 删除筛选条件
  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onFilterChange(updated);
  };

  // 清空所有筛选
  const clearFilters = () => {
    setConditions([]);
    setKeyword('');
    onFilterChange([]);
    onSearch('');
  };

  // 搜索
  const handleSearch = () => {
    onSearch(keyword);
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, onSearch]);

  return (
    <div className="mb-6">
      {/* 搜索栏 */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="搜索..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          className="flex-1"
        />
        <Button 
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
        >
          筛选
        </Button>
        {(conditions.length > 0 || keyword) && (
          <Button 
            icon={<ClearOutlined />}
            onClick={clearFilters}
          >
            清空
          </Button>
        )}
      </div>

      {/* 筛选条件 */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map(filter => (
              <Button
                key={filter.field}
                size="small"
                onClick={() => addCondition(filter.field)}
                disabled={conditions.some(c => c.field === filter.field)}
              >
                + {filter.label}
              </Button>
            ))}
          </div>

          {conditions.map((condition, index) => {
            const filterConfig = filters.find(f => f.field === condition.field);
            if (!filterConfig) return null;

            return (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <Tag>{filterConfig.label}</Tag>
                <Select
                  value={condition.operator}
                  onChange={(value) => updateCondition(index, { operator: value })}
                  style={{ width: 120 }}
                  options={[
                    { label: '包含', value: 'contains' },
                    { label: '等于', value: 'eq' },
                    { label: '大于', value: 'gt' },
                    { label: '小于', value: 'lt' },
                  ]}
                />
                {filterConfig.type === 'select' ? (
                  <Select
                    value={condition.value}
                    onChange={(value) => updateCondition(index, { value })}
                    style={{ width: 200 }}
                    options={filterConfig.options || []}
                  />
                ) : (
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="输入值"
                    style={{ width: 200 }}
                  />
                )}
                <Button 
                  size="small" 
                  danger
                  onClick={() => removeCondition(index)}
                >
                  删除
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* 已选筛选条件 */}
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {conditions.map((condition, index) => {
            const filterConfig = filters.find(f => f.field === condition.field);
            return (
              <Tag key={index} closable onClose={() => removeCondition(index)}>
                {filterConfig?.label} {condition.operator} {condition.value}
              </Tag>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataFilter;
